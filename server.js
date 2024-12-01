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
// console.log("private_key ", process.env.PRIVATE_KEY.replace(/\\n/g, "\n"));
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: "projectbot-ab06a",
    private_key_id: "bf01c3ec076cbc98e1f4165f4dda1e6718469370",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3mWINCacn4LX4\n/k5j06eSV/rahoFII4dr9BNL6k6x44VLkWZj22Zz+ccymGM8aukdumijuNSoyq9o\nymB2iAWx2ERB9r0w1cZUdF39K44+QmihqIFRQt1WOeXUtof2OSNRsHrdese0HHts\ncHXb/qQJWzMoHLHFlKEb3XYfqXgxcbQJpLgyvDy647udKRWul9F40OcU5UDNUNR0\n91E/1wqjjVghDGntxxoJZMTBV+pZWXBAhKEIH7eNWA73vRG46yatdiYeLctmxACe\ns7RSEs/PCMPvPojnOlui1kEjapj2G/6ioQ1dLGTxOr/wrXXv5QqCxeEzyNLAhFJ0\n9w4bCOf1AgMBAAECggEABxMvZ4qDVe9o/vT7yKLpS1bxFeOTghf+ZrJQRD9j9DzT\nUBY31un0OkyTuMPz2DbtdnjbTrdqmHnxBWDkRtHW8fBZyja+7SDiKuYUd7mEAN58\n9JsCWrZXKNsdaG0Qc03mqfknqIO/Km/J8Moq1h6reKg6e5WTFlnnIgrOoiM2or8R\nG1Fh1hSzdII/yJEgaGXR2t8/KdGq1SA+Os6YKst0r/c5ALCzM81t8KFX26g31LaU\nglmzjCRIkPHlfDQydqkZdc+u7WGiDF+JW83823hCJ2zERWSzoPEpVfX/Xfq+bmw7\n/uRna5N0KfNylaQ34hFwg5ZOkLQJiikgZjVRge74wQKBgQD6kbyGpNyqifH6TI1O\nK5xHbJxfhpz774neCKi9Z4OfwGqRWxm1J51WgYrDH7nHay8V+7t1XJfEXERcvQNM\nTornsWyj0Q1t8T2YwnSxKX38wYF2CosCUcGScoDAGOYsTikOuPRVK/7bXjBF+RQv\nG1H3OsqlB4zU79TaxSdoJXDnNQKBgQC7lBF0fHg/fTKz04OkHyCNs+xu1ekzaAaD\nxUz0A5ZgxgrNER9S9W2HdDKxyen4myI8X0Ww/CapQYr7rPQ+WhhNkf8lMCoeZbp0\nefr1KfVW8c1hY/dx9g+3Do4GKPOx8H8baDpJ9NNyks/Kdajnt9RNawrgOx1raNO9\nt+s1ak5VwQKBgQDAjtbOsktSU4g9zi6ZcDI9QV46mvxxL/hHRWhHhhFE513+LoBn\nEvZ60DqPEQZ4FgqtXjMFUg7fu/hdPHQYZBOjUlom2jTz1Hx9tJJww24qm5qd2CRT\nt/iGTrBa78eTLM2onsJF4fWNJ6j5XR0BxoEK+YdZo5+61ERDi1dpVbyaMQKBgAjz\n8EFXD4Y4O4tJtSbINY2N4OMJYrAJbwYrDJk48px711giURRskmW8rg6+TGSJQwEO\nqwzffBjn//IzNxUix7YsGbl0qw34XQXiLJA3CHa148+aLd1KmUVrdGvm2HrNt8Nf\nHikZfl4hk7leFEm7BG8NhN9e8vCFeFW9yYQrJsIBAoGAcrYbxh2sPyJHpL2Qa3Z1\n6dd7qxbUlK1nxr6V3lRAp6i5zpuRHwFvtRV7v5XeJtTmbgoHJrberYse+uoWeTR9\nu29FLQLZ2dTA1jnqcaRZp3whOij9SZ78GkMpuTwkFBNKeeAtQqGRStCU7WoRFu4P\nhfljRGfI3RAX0zK/QuHBm3I=\n-----END PRIVATE KEY-----\n",
    client_email:
      "license-plate-recognition@projectbot-ab06a.iam.gserviceaccount.com",
    client_id: "109339087104333336591",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/license-plate-recognition%40projectbot-ab06a.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
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
      type: "service_account",
      project_id: "projectbot-ab06a",
      private_key_id: "bf01c3ec076cbc98e1f4165f4dda1e6718469370",
      private_key:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3mWINCacn4LX4\n/k5j06eSV/rahoFII4dr9BNL6k6x44VLkWZj22Zz+ccymGM8aukdumijuNSoyq9o\nymB2iAWx2ERB9r0w1cZUdF39K44+QmihqIFRQt1WOeXUtof2OSNRsHrdese0HHts\ncHXb/qQJWzMoHLHFlKEb3XYfqXgxcbQJpLgyvDy647udKRWul9F40OcU5UDNUNR0\n91E/1wqjjVghDGntxxoJZMTBV+pZWXBAhKEIH7eNWA73vRG46yatdiYeLctmxACe\ns7RSEs/PCMPvPojnOlui1kEjapj2G/6ioQ1dLGTxOr/wrXXv5QqCxeEzyNLAhFJ0\n9w4bCOf1AgMBAAECggEABxMvZ4qDVe9o/vT7yKLpS1bxFeOTghf+ZrJQRD9j9DzT\nUBY31un0OkyTuMPz2DbtdnjbTrdqmHnxBWDkRtHW8fBZyja+7SDiKuYUd7mEAN58\n9JsCWrZXKNsdaG0Qc03mqfknqIO/Km/J8Moq1h6reKg6e5WTFlnnIgrOoiM2or8R\nG1Fh1hSzdII/yJEgaGXR2t8/KdGq1SA+Os6YKst0r/c5ALCzM81t8KFX26g31LaU\nglmzjCRIkPHlfDQydqkZdc+u7WGiDF+JW83823hCJ2zERWSzoPEpVfX/Xfq+bmw7\n/uRna5N0KfNylaQ34hFwg5ZOkLQJiikgZjVRge74wQKBgQD6kbyGpNyqifH6TI1O\nK5xHbJxfhpz774neCKi9Z4OfwGqRWxm1J51WgYrDH7nHay8V+7t1XJfEXERcvQNM\nTornsWyj0Q1t8T2YwnSxKX38wYF2CosCUcGScoDAGOYsTikOuPRVK/7bXjBF+RQv\nG1H3OsqlB4zU79TaxSdoJXDnNQKBgQC7lBF0fHg/fTKz04OkHyCNs+xu1ekzaAaD\nxUz0A5ZgxgrNER9S9W2HdDKxyen4myI8X0Ww/CapQYr7rPQ+WhhNkf8lMCoeZbp0\nefr1KfVW8c1hY/dx9g+3Do4GKPOx8H8baDpJ9NNyks/Kdajnt9RNawrgOx1raNO9\nt+s1ak5VwQKBgQDAjtbOsktSU4g9zi6ZcDI9QV46mvxxL/hHRWhHhhFE513+LoBn\nEvZ60DqPEQZ4FgqtXjMFUg7fu/hdPHQYZBOjUlom2jTz1Hx9tJJww24qm5qd2CRT\nt/iGTrBa78eTLM2onsJF4fWNJ6j5XR0BxoEK+YdZo5+61ERDi1dpVbyaMQKBgAjz\n8EFXD4Y4O4tJtSbINY2N4OMJYrAJbwYrDJk48px711giURRskmW8rg6+TGSJQwEO\nqwzffBjn//IzNxUix7YsGbl0qw34XQXiLJA3CHa148+aLd1KmUVrdGvm2HrNt8Nf\nHikZfl4hk7leFEm7BG8NhN9e8vCFeFW9yYQrJsIBAoGAcrYbxh2sPyJHpL2Qa3Z1\n6dd7qxbUlK1nxr6V3lRAp6i5zpuRHwFvtRV7v5XeJtTmbgoHJrberYse+uoWeTR9\nu29FLQLZ2dTA1jnqcaRZp3whOij9SZ78GkMpuTwkFBNKeeAtQqGRStCU7WoRFu4P\nhfljRGfI3RAX0zK/QuHBm3I=\n-----END PRIVATE KEY-----\n",
      client_email:
        "license-plate-recognition@projectbot-ab06a.iam.gserviceaccount.com",
      client_id: "109339087104333336591",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/license-plate-recognition%40projectbot-ab06a.iam.gserviceaccount.com",
      universe_domain: "googleapis.com",
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
