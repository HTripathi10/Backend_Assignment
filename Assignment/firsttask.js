const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());


const mockUsers = [
  { id: 1, username: "admin", password: "12345678", role: "admin" },
  { id: 2, username: "user", password: "12345678.", role: "user" }
];

const JWT_SECRET = "secret_key";


app.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  const foundUser = mockUsers.find(user => user.username === username);

  // Verify the user's password and credentials
  if (!foundUser || !bcrypt.compareSync(password, foundUser.password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ userId: foundUser.id, role: foundUser.role }, JWT_SECRET, { expiresIn: "1h" });
  
  return res.json({ token });
});

const verifyToken = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
      if (err) return res.status(403).json({ message: "Unauthorized access" });
      
      // Check if the user's role matches the allowed roles for the route
      if (allowedRoles.length && !allowedRoles.includes(userPayload.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      req.user = userPayload;
      next();
    });
  };
};

app.get("/admin", verifyToken(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin! You have access to admin-only resources." });
});

app.get("/dashboard", verifyToken(["user", "admin"]), (req, res) => {
  res.json({ message: `Hello, ${req.user.role}! Here is your dashboard.` });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
