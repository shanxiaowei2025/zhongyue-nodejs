export default () => ({
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'zhongyue-minio-api.starlogic.tech',
    port: parseInt(process.env.MINIO_PORT || '443', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'zhongyue',
    region: process.env.MINIO_REGION || 'us-east-1',
    pathStyle: process.env.MINIO_PATH_STYLE === 'true',
  },
});
