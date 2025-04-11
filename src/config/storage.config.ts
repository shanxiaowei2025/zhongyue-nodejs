export default () => ({
  minio: {
    endPoint: 'zhongyue-minio-api.starlogic.tech',
    port: 443,
    useSSL: true,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'zhongyue',
    region: 'us-east-1',
    pathStyle: true,
  },
});
