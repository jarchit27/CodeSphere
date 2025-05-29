# CodeSphere
git clone https://github.com/your-username/CodeSphere.git
cd CodeSphere
cd backend
npm install

📄 Create a .env file in the backend/ directory:
ACCESS_TOKEN_SECRET=your_secret_key_here

🧩 Create a config.json file for MongoDB connection:
{
  "connectString": "your_mongodb_connection_string_here"
}
npm start

cd ../frontend/cp_help
npm install
npm run dev
