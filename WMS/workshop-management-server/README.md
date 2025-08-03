# Workshop Management Server

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file in the root directory with:
```
MONGO_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Get your connection string
4. Replace `your_mongodb_atlas_connection_string_here` with your actual connection string

### 4. Start Server
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Register Request Body
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "admin" | "clubMember",
  "clubCode": "string"
}
```

### Login Request Body
```json
{
  "username": "string",
  "password": "string"
}
``` 