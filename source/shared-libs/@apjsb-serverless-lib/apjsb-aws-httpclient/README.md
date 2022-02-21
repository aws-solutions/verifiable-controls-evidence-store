# apjsb-aws-httpclient
### Usage
Default
```
import {ApjsbAwsHttpClient} from '@apjsb-serverless-lib/apjsb-aws-httpclient'
const httpClient = new ApjsbAwsHttpClient(credentialProvider, 'ap-southeast-2');
```

With https agent
```
import {ApjsbAwsHttpClient} from '@apjsb-serverless-lib/apjsb-aws-httpclient'
const httpsAgent = new https.Agent({ca: ''})
const httpClient = new ApjsbAwsHttpClient(credentialProvider, 'ap-southeast-2', httpsAgent);
```
