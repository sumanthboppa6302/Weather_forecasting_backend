const express = require("express"); // to create server and routes and middleware
const mongoose = require("mongoose"); // db operations
const cors = require("cors"); // frontend and backend communication
const bcrypt = require("bcrypt"); // for encryption
const dotenv = require("dotenv"); // env variables

dotenv.config(); // Load environment variables before using them

const app = express();
const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not defined
const MONGODB_URL = process.env.MONGODB_URL; // Correct environment variable name

// Middleware
app.use(cors());
app.use(express.json());

const Schema = mongoose.Schema;
const loginSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const LoginDetails = mongoose.model("LoginDetails", loginSchema);

// Connect to db { useNewUrlParser: true, useUnifiedTopology: true }
mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("connected to db");
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Please enter both username and password" });
  }
  try {
    const existingUser = await LoginDetails.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new LoginDetails({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "error registering user" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Please enter both username and password" });
  }

  try {
    const user = await LoginDetails.findOne({ username });
    if (!user) {
      return res.status(401).json({ errors: "invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Enter correct password" });
    }
    res.status(200).json({ message: "Login Successful" });
  } catch (error) {
    res.status(500).json({ error: "Login Failed" });
  }
});
