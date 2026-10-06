const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;
const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DATABASE_NAME = 'account-db';

let db;

// ตั้งค่าอ่านข้อมูลจาก Form/JSON และเปิดใช้งานไฟล์สแตติก
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API สำหรับสมัครสมาชิก (Register)
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, name, email } = req.body;
        const users = db.collection('users');

        // เช็กว่ามี username นี้หรือยัง
        const existingUser = await users.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username นี้ถูกใช้งานแล้ว' });
        }

        // เข้ารหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // บันทึกลงฐานข้อมูล
        await users.insertOne({
            username,
            password: hashedPassword,
            name,
            email,
            createdAt: new Date()
        });

        res.json({ message: 'สมัครสมาชิกสำเร็จ!' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

// API สำหรับเข้าสู่ระบบ (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = db.collection('users');

        const user = await users.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'ไม่พบผู้ใช้นี้ในระบบ' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        res.json({ message: 'เข้าสู่ระบบสำเร็จ!', name: user.name });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

// เชื่อมต่อฐานข้อมูลและเริ่มรัน Server
async function startServer() {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log('Connected to MongoDB successfully');

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();