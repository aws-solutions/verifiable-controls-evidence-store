/* 
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
import * as aws from 'aws-sdk';
import AGSError from 'src/common/AGSError';
import { AppConfiguration } from 'src/common/configuration/AppConfiguration';
import {
    LedgerDigest,
    BlockAddress,
    ElasticSearchEvidenceData,
} from './schemas/EvidenceDataWithContent';
import { dom, dumpText, load } from 'ion-js';
import { inject, injectable } from 'tsyringe';
import * as crypto from 'crypto';
import { Logger, LoggerFactory } from '@apjsb-serverless-lib/logger';

@injectable()
export class QldbHelper {
    private readonly logger: Logger;
    private readonly ledgerName: string;
    constructor(
        @inject('AppConfiguration') appConfig: AppConfiguration,
        @inject('QLDB') private qldb: aws.QLDB,
        @inject('LoggerFactory') loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.getLogger('QldbHelper');
        this.ledgerName = appConfig.evidenceLedgerName;
    }

    async getDigest(): Promise<LedgerDigest> {
        try {
            const response = await this.qldb
                .getDigest({ Name: this.ledgerName })
                .promise();

            let tipAddress: BlockAddress | undefined = undefined;

            if (response.DigestTipAddress.IonText) {
                const decodedTipAddress = load(response.DigestTipAddress.IonText);
                if (decodedTipAddress) {
                    tipAddress = {
                        sequenceNo: decodedTipAddress.get('sequenceNo')!.numberValue()!,
                        strandId: decodedTipAddress.get('strandId')!.stringValue()!,
                    };
                }
            }

            return {
                digest: Buffer.from(<Uint8Array>response.Digest).toString('base64'),
                digestTipAddress: tipAddress,
            };
        } catch (error) {
            throw new AGSError(
                `An error occurred while retrieving digest for ledger - ${
                    this.ledgerName
                } - error ${JSON.stringify(error)}`,
                500,
                true
            );
        }
    }

    async verifyRevision(evidence: ElasticSearchEvidenceData): Promise<boolean> {
        try {
            let digest: LedgerDigest = evidence.revisionDetails.digest;

            if (
                !digest.digestTipAddress ||
                digest.digestTipAddress.sequenceNo <
                    evidence.revisionDetails.blockAddress.sequenceNo
            ) {
                digest = await this.getDigest();
            }

            const result = await this.qldb
                .getRevision({
                    Name: this.ledgerName,
                    DocumentId: evidence.revisionDetails.metadata.id,
                    DigestTipAddress: {
                        IonText: dumpText(load(JSON.stringify(digest.digestTipAddress))),
                    },
                    BlockAddress: {
                        IonText: dumpText(
                            load(JSON.stringify(evidence.revisionDetails.blockAddress))
                        ),
                    },
                })
                .promise();

            const proofs = this.extractProofValue(result.Proof);

            if (!proofs) {
                this.logger.info(
                    `Unable to retrieve revision verification proof for evidence with id ${evidence.evidenceId}`
                );

                return false;
            }

            let documentHash: Uint8Array = Buffer.from(
                evidence.revisionDetails.hash,
                'base64'
            );

            proofs.forEach((item) => {
                documentHash = this.dot(documentHash, item);
            });

            const verified = this.isEqual(
                Buffer.from(digest.digest, 'base64'),
                documentHash
            );

            if (!verified) {
                this.logger.info(
                    `Unable to verify revision status for evidence with id ${evidence.evidenceId}`
                );
                return false;
            }

            return true;
        } catch (error) {
            throw new AGSError(
                `An error occurred while verifying the revision - error ${JSON.stringify(
                    error
                )}`,
                500,
                true
            );
        }
    }

    async verifyBlock(evidence: ElasticSearchEvidenceData): Promise<boolean> {
        try {
            let digest: LedgerDigest = evidence.revisionDetails.digest;

            if (
                !digest.digestTipAddress ||
                digest.digestTipAddress.sequenceNo <
                    evidence.revisionDetails.blockAddress.sequenceNo
            ) {
                digest = await this.getDigest();
            }
            const result = await this.qldb
                .getBlock({
                    Name: this.ledgerName,
                    BlockAddress: {
                        IonText: dumpText(
                            load(JSON.stringify(evidence.revisionDetails.blockAddress))
                        ),
                    },
                    DigestTipAddress: {
                        IonText: dumpText(load(JSON.stringify(digest.digestTipAddress))),
                    },
                })
                .promise();

            let blockHash = load(result.Block.IonText!)!
                .get('blockHash')!
                .uInt8ArrayValue()!;

            const blockProofs = this.extractProofValue(result.Proof);

            blockProofs?.forEach((x) => {
                blockHash = this.dot(blockHash, x);
            });

            const verified = this.isEqual(
                Buffer.from(digest.digest, 'base64'),
                blockHash
            );

            if (!verified) {
                this.logger.info(
                    `Unable to verify block status for evidence with id ${evidence.evidenceId}`
                );
                return false;
            }

            return true;
        } catch (error) {
            throw new AGSError(
                `An error occurred while verifying the block - error ${JSON.stringify(
                    error
                )}`
            );
        }
    }

    private extractProofValue(valueHolder?: aws.QLDB.ValueHolder): Uint8Array[] | null {
        if (valueHolder && valueHolder.IonText) {
            const proofs = load(valueHolder.IonText);

            if (proofs) {
                const proofValues = proofs
                    .elements()
                    .map((proofValue: dom.Value) => proofValue.uInt8ArrayValue())
                    .filter((x) => x !== null);

                return proofValues as Uint8Array[];
            }
        }

        return null;
    }

    dot(hash1: Uint8Array, hash2: Uint8Array): Uint8Array {
        if (hash1.length == 0) return hash2;

        if (hash2.length == 0) {
            return hash1;
        }

        const hash = crypto.createHash('sha256');

        let concatenated: Uint8Array;
        if (this.hashComparator(hash1, hash2) < 0) {
            concatenated = this.concatenate(hash1, hash2);
        } else {
            concatenated = this.concatenate(hash2, hash1);
        }

        hash.update(concatenated);
        return hash.digest();
    }

    private concatenate(...arrays: Uint8Array[]): Uint8Array {
        let totalLength = 0;

        for (const array of arrays) {
            totalLength += array.length;
        }

        const result = new Uint8Array(totalLength);

        let offset = 0;
        for (const array of arrays) {
            result.set(array, offset);
            offset += array.length;
        }

        return result;
    }

    hashComparator(hash1: Uint8Array, hash2: Uint8Array): number {
        if (hash1.length != 32 || hash2.length != 32) {
            throw new AGSError('Invalid hash.');
        }

        for (let i = hash1.length - 1; i >= 0; i--) {
            const difference: number =
                ((hash1[i] << 24) >> 24) - ((hash2[i] << 24) >> 24);
            if (difference != 0) return difference;
        }

        return 0;
    }

    isEqual(expected: Uint8Array, actual: Uint8Array): boolean {
        if (expected === actual) return true;
        if (expected == null || actual == null) return false;
        if (expected.length != actual.length) return false;

        for (let i = 0; i < expected.length; i++) {
            if (expected[i] !== actual[i]) {
                return false;
            }
        }
        return true;
    }
}
