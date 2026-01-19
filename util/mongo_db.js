const MONGO_CONNECTION_USER = process.env.MONGO_CONNECTION_USER;
const MONGO_CONNECTION_PASSWORD = process.env.MONGO_CONNECTION_PASSWORD;
const MONGO_CONNECTION_CLUSTER = process.env.MONGO_CONNECTION_CLUSTER;
const MONGO_CONNECTION_APP_NAME =
  process.env.MONGO_CONNECTION_APP_NAME || "Cluster0";

if (
  !MONGO_CONNECTION_USER ||
  !MONGO_CONNECTION_PASSWORD ||
  !MONGO_CONNECTION_CLUSTER
) {
  throw new Error("❌ Missing MongoDB environment variables");
}

const MONGO_CONNECTION_URI =
  `mongodb+srv://${MONGO_CONNECTION_USER}:` +
  `${encodeURIComponent(MONGO_CONNECTION_PASSWORD)}@` +
  `${MONGO_CONNECTION_CLUSTER}/` +
  `?appName=${MONGO_CONNECTION_APP_NAME}`;

const getConnectionString = () => MONGO_CONNECTION_URI;

module.exports = { getConnectionString };
