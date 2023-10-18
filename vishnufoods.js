var express = require('express');
var app = express();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
var bodyParser = require('body-parser');
var request = require('request');
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

var serviceAccount = require("./key.json");
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.use(express.static(__dirname));

// Function to hash passwords
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Function to check for duplicate email
async function isEmailUnique(email) {
  const querySnapshot = await db.collection("studentsinfo")
    .where("Email", "==", email)
    .get();
  return querySnapshot.empty;
}

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/home.html");
});

app.get('/signup', function (req, res) {
  res.sendFile(__dirname + "/signuppage.html");
});

app.post('/signupsubmit', async function (req, res) {
  const { fullname, email, password } = req.body;

  // Check if email is unique
  const isUnique = await isEmailUnique(email);

  if (!isUnique) {
    return res.send("Email address is already in use. Please choose another email.");
  }

  // Hash the password before storing
  const hashedPassword = await hashPassword(password);

  // Store the user data
  db.collection("studentsinfo").add({
    Fullname: fullname,
    Email: email,
    password: hashedPassword
  });

  res.redirect("/login");
});

app.get('/login', function (req, res) {
  res.sendFile(__dirname + "/loginpage.html");
});

app.post('/loginsubmit', async function (req, res) {
  const { email, password } = req.body;

  const querySnapshot = await db.collection("studentsinfo")
    .where("Email", "==", email)
    .get();

  if (querySnapshot.empty) {
    return res.send("Email not found. Please check your email or sign up.");
  }

  const userDoc = querySnapshot.docs[0];
  const hashedPassword = userDoc.data().password;

  // Compare hashed password
  const passwordMatch = await bcrypt.compare(password, hashedPassword);

  if (passwordMatch) {
    res.redirect("/vishnufoods");
  } else {
    res.send("Incorrect password. Please try again.");
  }
});

app.get('/vishnufoods', function (req, res) {
  res.sendFile(__dirname + "/vishnufoods.html");
});

app.get('/myorders', function (req, res) {
  res.sendFile(__dirname + "/myorders.html");
});


app.get('/home', function (req, res) {
  res.sendFile(__dirname + "/home.html");
});

app.get('/logout', function (req, res) {
  res.redirect("/home");
});

app.listen(3000, function () {
  console.log('Running on port 3000!');
});
