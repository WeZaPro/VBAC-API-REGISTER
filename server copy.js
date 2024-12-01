const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // Allow handling FormData
app.use(bodyParser.json());
const upload = multer({ dest: "uploads/" }); // Save uploaded files in the 'uploads' folder

// ตั้งค่า Google Drive API ====================
// const keyPath = "./service_account.json";
// const auth = new google.auth.GoogleAuth({
//   keyFile: keyPath,
//   scopes: ["https://www.googleapis.com/auth/drive.file"],
// });

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  },
  scopes: "https://www.googleapis.com/auth/drive.file",
});

const drive = google.drive({ version: "v3", auth });
const folderId = process.env.folderId;

// ตั้งค่า Google Sheet API ====================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    return res.status(200).json({});
  }
  next();
});

async function getAuthSheets() {
  // const auth = new google.auth.GoogleAuth({
  //   keyFile: "./service_account.json",
  //   scopes: "https://www.googleapis.com/auth/spreadsheets",
  // });

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    },
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();

  const googleSheets = google.sheets({
    version: "v4",
    auth: client,
  });

  const spreadsheetId = process.env.spreadsheetId;

  return {
    auth,
    client,
    googleSheets,
    spreadsheetId,
  };
}

// ฟังก์ชันสำหรับอัปโหลดไฟล์ไปยัง Google Drive
async function uploadToDrive(filePath, fileName, mimeType) {
  try {
    const fileMetadata = {
      name: fileName, // ใช้ชื่อไฟล์ที่มาจากผู้ใช้
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id",
    });

    const fileId = response.data.id;

    // ตั้งค่าไฟล์ให้แชร์แบบสาธารณะ
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // คืน URL สาธารณะ
    return `https://drive.google.com/uc?id=${fileId}`;
  } catch (error) {
    console.error("Error uploading to Google Drive:", error.message);
    throw error;
  }
}
app.post("/submit", upload.single("file"), async (req, res) => {
  const file = req.file; // รับไฟล์ที่อัปโหลด
  const { date, name, phone, email, displayName, lineUserId, param } = req.body;
  console.log("req.body ", req.body);

  if (!file) {
    return res.status(400).send({ message: "No file uploaded!" });
  }

  try {
    // อัปโหลดไฟล์ไปยัง Google Drive
    const fileName = req.body.phone + path.extname(file.originalname);
    const fileUrl = await uploadToDrive(file.path, fileName, file.mimetype);
    // ลบไฟล์ชั่วคราวในเซิร์ฟเวอร์
    fs.unlinkSync(file.path);

    const data_register = {
      fileUrl: fileUrl,
      fileName: fileName,
      date: req.body.date,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      displayName: req.body.displayName,
      lineUserId: req.body.lineUserId,
      param: req.body.param,
    };

    // console.log("data_register >>>  ", data_register);

    const data = [
      // ["วันที่", "ชื่อ", "คะแนน"], // หัวตาราง
      ["2024-11-30", "สมชาย", 95],
      ["2024-11-30", "สมศรี", 88],
    ];
    const register_data = [
      [
        data_register.param,
        data_register.lineUserId,
        data_register.displayName,
        data_register.email,
        data_register.phone,
        data_register.name,
        data_register.date,
        data_register.fileName,
        data_register.fileUrl,
      ],
    ];
    appendDataToSheet(register_data);

    res.send({
      message: "File uploaded successfully to Google Drive!",
      dataCustomer: req.body,
      file: {
        name: fileName,
        url: fileUrl, // ส่งคืน URL ของไฟล์ใน Google Drive
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  } catch (err) {
    console.log("err--> ", err);
  }
});

async function appendDataToSheet(data) {
  const { googleSheets, spreadsheetId } = await getAuthSheets();

  try {
    const response = await googleSheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1", // ช่วงของ Sheet ที่ต้องการเพิ่มข้อมูล (ระบุชื่อ Sheet)
      valueInputOption: "USER_ENTERED", // เลือกประเภทการป้อนค่า (เช่น USER_ENTERED หรือ RAW)
      resource: {
        values: data, // ข้อมูลที่ต้องการเพิ่มเป็นรูปแบบ Array 2D [[ค่า1, ค่า2], [ค่า3, ค่า4]]
      },
    });

    console.log("Data appended successfully:", response.data.updates);
  } catch (error) {
    console.error("Error appending data:", error);
  }
}

// ตัวอย่างการเรียกใช้งาน
// const data = [
//   ["วันที่", "ชื่อ", "คะแนน"], // หัวตาราง
//   ["2024-11-30", "สมชาย", 95],
//   ["2024-11-30", "สมศรี", 88],
// ];

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
