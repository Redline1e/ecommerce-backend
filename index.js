const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error: ", err));

// API root endpoint
app.get("/", (req, res) => {
  res.send("Express App is running");
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "/upload/images"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({ storage });

// Static file serving for images
app.use("/images", express.static(path.join(__dirname, "/upload/images")));

// Creating upload endpoint for images (POST)
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: 0,
      message: "No file uploaded",
    });
  }

  res.json({
    success: 1,
    image_url: `http://localhost:${process.env.PORT}/images/${req.file.filename}`,
  });
});

// Schema for creating products
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Number,
    default: Date.now(),
  },
  avilable: {
    type: Boolean,
    default: true,
  },
});

// Route for adding a product
app.post("/addproduct", async (req, res) => {
  try {
    const lastProduct = await Product.findOne().sort({ id: -1 });
    let id = lastProduct ? lastProduct.id + 1 : 1;

    const product = new Product({
      id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });

    await product.save();
    res.status(200).json({
      success: 1,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: "Error adding product",
      error: error.message,
    });
  }
});

// Route for removing a product
app.delete("/removeproduct", async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.body.id });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({
      success: true,
      message: "Product removed",
      name: req.body.name,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing product",
      error: error.message,
    });
  }
});

// Route for fetching all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  res.send(products);
});

// Route for fetching new collection
app.get("/newcollection", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  res.send(newcollection);
});

// Route for fetching popular products in women category
app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({ category: "women" });
  let popular_in_woman = products.slice(0, 4);
  res.send(popular_in_woman);
});

// Route for fetching related products
app.get("/reletedproducts", async (req, res) => {
  let products = await Product.find({});
  let reletedProducts = products.slice(0, 4);
  res.send(reletedProducts);
});

// Middleware for user authentication
const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res
      .status(401)
      .send({ errors: "Please authenticate using valid token" });
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res
      .status(401)
      .send({ errors: "Please authenticate using valid token" });
  }
};

// Route to add item to cart
app.post("/addtocart", fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("Added");
});

// Route to remove item from cart
app.delete("/removefromcart", fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0) {
    userData.cartData[req.body.itemId] -= 1;
  }
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("Removed");
});

// Route to get user's cart
app.post("/getcart", fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

// User schema
const Users = mongoose.model("Users", {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

// Route for user registration with validation
app.post(
  "/signup",
  [
    body("email").isEmail().withMessage("Enter a valid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({
        success: false,
        errors: "Existing user found with the same email address",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }

    const user = new Users({
      name: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      cartData: cart,
    });

    await user.save();
    const data = {
      user: {
        id: user.id,
      },
    };
    const token = jwt.sign(data, process.env.JWT_SECRET);
    res.json({
      success: true,
      token,
    });
  }
);

// Route for user login with validation
app.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter a valid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let user = await Users.findOne({ email: req.body.email });
    if (user) {
      const passCompare = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (passCompare) {
        const data = {
          user: {
            id: user.id,
          },
        };
        const token = jwt.sign(data, process.env.JWT_SECRET);
        res.json({ success: true, token });
      } else {
        res.json({
          success: false,
          error: "Wrong Password",
        });
      }
    } else {
      res.json({
        success: false,
        error: "Wrong Email Id",
      });
    }
  }
);

///////////////////////////////////////////////////////

const Subscriber = mongoose.model("Subscriber ", {
  email: {
    type: String,
    required: true,
    unique: true,
  },
  dateSubscribed: {
    type: Date,
    default: Date.now(),
  },
});

app.post("/subscribe", async (req, res) => {
  const existingSubscriber = await Subscriber.findOne({
    email: req.body.email,
  });
  if (existingSubscriber) {
    return res.status(400).json({
      success: 0,
      message: "Email is already subscribed",
    });
  }
  try {
    const subscriber = new Subscriber({ email: req.body.email });
    await subscriber.save();
    res.status(200).json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: "Error subscribing",
      error: error.message,
    });
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};
app.post("/sendnewsletter", async (req, res) => {
  try {
    const subscribers = await Subscriber.find({});

    const emailSubject = "New Products Are Available!";
    const emailContent = "Check out our latest products and offers!";

    subscribers.forEach((subscriber) => {
      sendEmail(subscriber.email, emailSubject, emailContent);
    });

    res
      .status(200)
      .json({ success: true, message: "Emails sent to all subscribers." });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending newsletter",
      error: error.message,
    });
  }
});

// Start the server
app.listen(process.env.PORT, (error) => {
  if (!error) {
    console.log(`Server Running on port ${process.env.PORT}`);
  } else {
    console.error(`Error: ${error}`);
  }
});
