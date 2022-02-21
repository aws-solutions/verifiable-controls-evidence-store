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
import * as lambda from 'aws-lambda';

import { EvidenceData } from 'src/data/schemas/EvidenceData';
import { StreamHelper } from 'evidences-stream-processor/StreamHelper';

const helper = new StreamHelper();

describe.skip('deaggregateRecord tests', () => {
    test('can deaggregate kinesis record into user record', async () => {
        // arrange
        const record: lambda.KinesisStreamRecord = {
            awsRegion: 'ap-southeast-2',
            eventID: '12345',
            eventName: 'eventName',
            eventSource: 'kinesis',
            eventSourceARN: 'sourceArn',
            eventVersion: '1.0',
            invokeIdentityArn: 'identityArn',
            kinesis: {
                kinesisSchemaVersion: '1.0',
                partitionKey:
                    'bde5bae181d2605189f498b2da07549ddec07f167e9c3bec0a982293d6455c88',
                sequenceNumber:
                    '49615335803568034133942568622959839012070873710897135618',
                data: '84mawgpAZmQyNjI0M2I0NjY3NTgwMzY2ODExNTAxM2EyNjUyYWVjMjk4NTJmZDFjZjA0ODNiOGI5MjQ0NTZjN2ZlNjUwYwpAZWZhZGNhZTQxNmEzMjc4ODA3ODYyNGVmOGM0ZWYwNjFjNTA2YzY3M2Y5N2FjMTM4NTk0NWU5ZTEzMmRkNTQ0Nhq0BwgAGq8H4AEA6u4Cu4GD3gK2h74Cso1xbGRiU3RyZWFtQXJuinJlY29yZFR5cGWHcGF5bG9hZIxibG9ja0FkZHJlc3OIc3RyYW5kSWSKc2VxdWVuY2VOb410cmFuc2FjdGlvbklkjo5ibG9ja1RpbWVzdGFtcIlibG9ja0hhc2iLZW50cmllc0hhc2iOkXByZXZpb3VzQmxvY2tIYXNojo9lbnRyaWVzSGFzaExpc3SOj3RyYW5zYWN0aW9uSW5mb4pzdGF0ZW1lbnRziXN0YXRlbWVudIlzdGFydFRpbWWOj3N0YXRlbWVudERpZ2VzdIlkb2N1bWVudHOOljZXWHo5d2RhamlZN0s1dTZZd0dVTjSJdGFibGVOYW1lh3RhYmxlSWSOkXJldmlzaW9uU3VtbWFyaWVzhGhhc2iKZG9jdW1lbnRJZN4E6oqO02Fybjphd3M6cWxkYjphcC1zb3V0aGVhc3QtMjo2MDIzOTA4MTIzOTY6c3RyZWFtL0F0dGVzdGF0aW9ucy9BWWo4Z1NJVWN4aUhpanNqRUtvYjMwi41CTE9DS19TVU1NQVJZjN4EgY3enI6OljBWd0dlSEQ3UTlMTDRIU0M1NWdEU3CPIQ6QjpY1cHhtejhGRDlBajhDYmw1a3V2WHhQkWuAD+WCiYKQhsMA8pKuoP0mJDtGZ1gDZoEVATomUq7CmFL9HPBIO4uSRFbH/mUMk66gHMUhiiko+avf3tdmTdfrm5ZH6qiJr8YtKyfpotUPdZuUrqC9emhyqW0MlZm9oyd8DsTkH7K1FizH/9akdVHn3k3EJJW+AYiuoF1JThim7I3ZT+g/UdwIIPFEpKev6W1L6TLjQMGXZo4DrqDvrcrkFqMniAeGJO+MTvBhxQbGc/l6wThZRenhMt1URq6gRHqOtQ/dkVGFekATzwxlIz67YQjVstqYtDAqcJgwDd2uoIO7jXv1TQBw1yWBMr2V3eIbl+MmFYuKJ9X6K5z3DqCblt4Bgpe+z97NmI6aSU5TRVJUIElOVE8gYXR0ZXN0YXRpb25zID+Za4AP5YKJgpCGwwDLmq6gTUQRGkJxVzFJS1jUUgfABC0CgFqTlfZtGFkZyLU2hOab3q2c3qqdjGF0dGVzdGF0aW9uc56Olkt3bzZveHRHVWQxNHZIVWVwbTdPdlCXsSCfvr7evKCuoO+tyuQWoyeIB4Yk74xO8GHFBsZz+XrBOFlF6eEy3VRGoY6WNldYejl3ZGFqaVk3SzV1Nll3R1VONBqIBwgBGoMH4AEA6u4B7oGD3gHph74B5Y1xbGRiU3RyZWFtQXJuinJlY29yZFR5cGWHcGF5bG9hZIl0YWJsZUluZm+JdGFibGVOYW1lh3RhYmxlSWSIcmV2aXNpb26MYmxvY2tBZGRyZXNziHN0cmFuZElkinNlcXVlbmNlTm+EaGFzaIRkYXRhjWF0dGVzdGF0aW9uSWSLYXV0aG9yaXR5SWSLY29udGVudEhhc2iOj2NvbnRlbnRMb2NhdGlvbo6QY3JlYXRlZFRpbWVzdGFtcIh0YXJnZXRJZIlpbnB1dEhhc2iIbWV0YWRhdGGCaWSGdHhUaW1lhHR4SWTeBYuKjtNhcm46YXdzOnFsZGI6YXAtc291dGhlYXN0LTI6NjAyMzkwODEyMzk2OnN0cmVhbS9BdHRlc3RhdGlvbnMvQVlqOGdTSVVjeGlIaWpzakVLb2IzMIuOkFJFVklTSU9OX0RFVEFJTFOM3gSejd6njoxhdHRlc3RhdGlvbnOPjpZLd282b3h0R1VkMTR2SFVlcG03T3ZQkN4D8JHenJKOljBWd0dlSEQ3UTlMTDRIU0M1NWdEU3CTIQ6UrqDvrcrkFqMniAeGJO+MTvBhxQbGc/l6wThZRenhMt1URpXeAuaWjqQ2OTM3NGYyNS01MjM0LTRhM2EtOTNlZi0yMGM3NGM0YTE5MDaXjqRmZTFmMzk2Mi00Y2VjLTRjNzYtYWNlOC02YzdjNWYyZmY2ZjGYjqxNTHBOa2pXd252bW10UEY3UHR1ZldTWXU0bHU5bWNuYmIyN3d1NFg3NWZFPZmOAYlodHRwczovL3MzLmFwLXNvdXRoZWFzdC0yLmFtYXpvbmF3cy5jb20vZmUxZjM5NjItNGNlYy00Yzc2LWFjZTgtNmM3YzVmMmZmNmYxL3NvbWUtdGFyZ2V0LTEyMy9NTHBOa2pXd252bW10UEY3UHR1ZldTWXU0bHU5bWNuYmIyN3d1NFg3NWZFPZqOmDIwMjEtMDItMDlUMDI6MTY6MDUuOTA4WpuOj3NvbWUtdGFyZ2V0LTEyM5yOrENtMXF1K2JtTFA1ZXRzL3FRMHpHY1dDWmRmSkh1WXFnTEwxTjFXOFFDY1k9nd7Bno6WNldYejl3ZGFqaVk3SzV1Nll3R1VONIUgn2uAD+WCiYKQhsMA8KCOljVweG16OEZEOUFqOENibDVrdXZYeFBeimRPRIlnPH4+HCAdgvlJ',
                approximateArrivalTimestamp: 1612869124.1,
            },
        };

        // act
        const userRecords = await helper.deaggregateRecord(record);

        // assert
        expect(userRecords).not.toBeUndefined();
        expect(userRecords.length).toBeGreaterThan(0);
    });
});

describe.skip('filterRecords tests', () => {
    test('can filter revision details records', () => {
        // arrange
        const userRecords = [
            {
                partitionKey: '123',
                sequenceNumber: '123',
                subSequenceNumber: 123,
                data: '4AEA6u4B7oGD3gHph74B5Y1xbGRiU3RyZWFtQXJuinJlY29yZFR5cGWHcGF5bG9hZIl0YWJsZUluZm+JdGFibGVOYW1lh3RhYmxlSWSIcmV2aXNpb26MYmxvY2tBZGRyZXNziHN0cmFuZElkinNlcXVlbmNlTm+EaGFzaIRkYXRhjWF0dGVzdGF0aW9uSWSLYXV0aG9yaXR5SWSLY29udGVudEhhc2iOj2NvbnRlbnRMb2NhdGlvbo6QY3JlYXRlZFRpbWVzdGFtcIh0YXJnZXRJZIlpbnB1dEhhc2iIbWV0YWRhdGGCaWSGdHhUaW1lhHR4SWTeBYuKjtNhcm46YXdzOnFsZGI6YXAtc291dGhlYXN0LTI6NjAyMzkwODEyMzk2OnN0cmVhbS9BdHRlc3RhdGlvbnMvQVlqOGdTSVVjeGlIaWpzakVLb2IzMIuOkFJFVklTSU9OX0RFVEFJTFOM3gSejd6njoxhdHRlc3RhdGlvbnOPjpZLd282b3h0R1VkMTR2SFVlcG03T3ZQkN4D8JHenJKOljBWd0dlSEQ3UTlMTDRIU0M1NWdEU3CTIQ6UrqDvrcrkFqMniAeGJO+MTvBhxQbGc/l6wThZRenhMt1URpXeAuaWjqQ2OTM3NGYyNS01MjM0LTRhM2EtOTNlZi0yMGM3NGM0YTE5MDaXjqRmZTFmMzk2Mi00Y2VjLTRjNzYtYWNlOC02YzdjNWYyZmY2ZjGYjqxNTHBOa2pXd252bW10UEY3UHR1ZldTWXU0bHU5bWNuYmIyN3d1NFg3NWZFPZmOAYlodHRwczovL3MzLmFwLXNvdXRoZWFzdC0yLmFtYXpvbmF3cy5jb20vZmUxZjM5NjItNGNlYy00Yzc2LWFjZTgtNmM3YzVmMmZmNmYxL3NvbWUtdGFyZ2V0LTEyMy9NTHBOa2pXd252bW10UEY3UHR1ZldTWXU0bHU5bWNuYmIyN3d1NFg3NWZFPZqOmDIwMjEtMDItMDlUMDI6MTY6MDUuOTA4WpuOj3NvbWUtdGFyZ2V0LTEyM5yOrENtMXF1K2JtTFA1ZXRzL3FRMHpHY1dDWmRmSkh1WXFnTEwxTjFXOFFDY1k9nd7Bno6WNldYejl3ZGFqaVk3SzV1Nll3R1VONIUgn2uAD+WCiYKQhsMA8KCOljVweG16OEZEOUFqOENibDVrdXZYeFA=',
            },
        ];

        // act
        const filteredRecords = helper.filterRecords<EvidenceData>(
            userRecords,
            'evidences'
        );

        // assert
        expect(filteredRecords.length).toBe(1);
        expect(filteredRecords[0].payload.revision.data).not.toBeUndefined();
    });

    test('should not include other types of records', () => {
        // arrange
        const userRecords = [
            {
                partitionKey: '123',
                sequenceNumber: '123',
                subSequenceNumber: 123,
                data: '4AEA6u4B7oGD3gHph74B5Y1xbGRiU3RyZWFtQXJuinJlY29yZFR5cGWHcGF5bG9hZIl0YWJsZUluZm+JdGFibGVOYW1lh3RhYmxlSWSIcmV2aXNpb26MYmxvY2tBZGRyZXNziHN0cmFuZElkinNlcXVlbmNlTm+EaGFzaIRkYXRhjWF0dGVzdGF0aW9uSWSLYXV0aG9yaXR5SWSLY29udGVudEhhc2iOj2NvbnRlbnRMb2NhdGlvbo6QY3JlYXRlZFRpbWVzdGFtcIh0YXJnZXRJZIlpbnB1dEhhc2iIbWV0YWRhdGGCaWSGdHhUaW1lhHR4SWTeBYuKjtNhcm46YXdzOnFsZGI6YXAtc291dGhlYXN0LTI6NjAyMzkwODEyMzk2OnN0cmVhbS9BdHRlc3RhdGlvbnMvQVlqOGdTSVVjeGlIaWpzakVLb2IzMIuOkFJFVklTSU9OX0RFVEFJTFOM3gSejd6njoxhdHRlc3RhdGlvbnOPjpZLd282b3h0R1VkMTR2SFVlcG03T3ZQkN4D8JHenJKOljBWd0dlSEQ3UTlMTDRIU0M1NWdEU3CTIQ6UrqDvrcrkFqMniAeGJO+MTvBhxQbGc/l6wThZRenhMt1URpXeAuaWjqQ2OTM3NGYyNS01MjM0LTRhM2EtOTNlZi0yMGM3NGM0YTE5MDaXjqRmZTFmMzk2Mi00Y2VjLTRjNzYtYWNlOC02YzdjNWYyZmY2ZjGYjqxNTHBOa2pXd252bW10UEY3UHR1ZldTWXU0bHU5bWNuYmIyN3d1NFg3NWZFPZmOAYlodHRwczovL3MzLmFwLXNvdXRoZWFzdC0yLmFtYXpvbmF3cy5jb20vZmUxZjM5NjItNGNlYy00Yzc2LWFjZTgtNmM3YzVmMmZmNmYxL3NvbWUtdGFyZ2V0LTEyMy9NTHBOa2pXd252bW10UEY3UHR1ZldTWXU0bHU5bWNuYmIyN3d1NFg3NWZFPZqOmDIwMjEtMDItMDlUMDI6MTY6MDUuOTA4WpuOj3NvbWUtdGFyZ2V0LTEyM5yOrENtMXF1K2JtTFA1ZXRzL3FRMHpHY1dDWmRmSkh1WXFnTEwxTjFXOFFDY1k9nd7Bno6WNldYejl3ZGFqaVk3SzV1Nll3R1VONIUgn2uAD+WCiYKQhsMA8KCOljVweG16OEZEOUFqOENibDVrdXZYeFA=',
            },
            {
                partitionKey: '123',
                sequenceNumber: '123',
                subSequenceNumber: 123,
                data: '4AEA6u4Cu4GD3gK2h74Cso1xbGRiU3RyZWFtQXJuinJlY29yZFR5cGWHcGF5bG9hZIxibG9ja0FkZHJlc3OIc3RyYW5kSWSKc2VxdWVuY2VOb410cmFuc2FjdGlvbklkjo5ibG9ja1RpbWVzdGFtcIlibG9ja0hhc2iLZW50cmllc0hhc2iOkXByZXZpb3VzQmxvY2tIYXNojo9lbnRyaWVzSGFzaExpc3SOj3RyYW5zYWN0aW9uSW5mb4pzdGF0ZW1lbnRziXN0YXRlbWVudIlzdGFydFRpbWWOj3N0YXRlbWVudERpZ2VzdIlkb2N1bWVudHOOljZXWHo5d2RhamlZN0s1dTZZd0dVTjSJdGFibGVOYW1lh3RhYmxlSWSOkXJldmlzaW9uU3VtbWFyaWVzhGhhc2iKZG9jdW1lbnRJZN4E6oqO02Fybjphd3M6cWxkYjphcC1zb3V0aGVhc3QtMjo2MDIzOTA4MTIzOTY6c3RyZWFtL0F0dGVzdGF0aW9ucy9BWWo4Z1NJVWN4aUhpanNqRUtvYjMwi41CTE9DS19TVU1NQVJZjN4EgY3enI6OljBWd0dlSEQ3UTlMTDRIU0M1NWdEU3CPIQ6QjpY1cHhtejhGRDlBajhDYmw1a3V2WHhQkWuAD+WCiYKQhsMA8pKuoP0mJDtGZ1gDZoEVATomUq7CmFL9HPBIO4uSRFbH/mUMk66gHMUhiiko+avf3tdmTdfrm5ZH6qiJr8YtKyfpotUPdZuUrqC9emhyqW0MlZm9oyd8DsTkH7K1FizH/9akdVHn3k3EJJW+AYiuoF1JThim7I3ZT+g/UdwIIPFEpKev6W1L6TLjQMGXZo4DrqDvrcrkFqMniAeGJO+MTvBhxQbGc/l6wThZRenhMt1URq6gRHqOtQ/dkVGFekATzwxlIz67YQjVstqYtDAqcJgwDd2uoIO7jXv1TQBw1yWBMr2V3eIbl+MmFYuKJ9X6K5z3DqCblt4Bgpe+z97NmI6aSU5TRVJUIElOVE8gYXR0ZXN0YXRpb25zID+Za4AP5YKJgpCGwwDLmq6gTUQRGkJxVzFJS1jUUgfABC0CgFqTlfZtGFkZyLU2hOab3q2c3qqdjGF0dGVzdGF0aW9uc56Olkt3bzZveHRHVWQxNHZIVWVwbTdPdlCXsSCfvr7evKCuoO+tyuQWoyeIB4Yk74xO8GHFBsZz+XrBOFlF6eEy3VRGoY6WNldYejl3ZGFqaVk3SzV1Nll3R1VONA==',
            },
        ];

        // act
        const filteredRecords = helper.filterRecords<EvidenceData>(
            userRecords,
            'evidences'
        );

        // assert
        expect(filteredRecords.length).toBe(1);
    });
});
