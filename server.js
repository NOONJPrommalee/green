const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3001; // จะรันที่ localhost:3001

app.use(cors());
app.use(express.json());

// เชื่อมต่อฐานข้อมูล MySQL (XAMPP)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // default ของ XAMPP
  password: '', // รหัสผ่านปกติจะว่าง
  database: 'purchases'
});

// เช็คการเชื่อมต่อ
db.connect(err => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// ดึงข้อมูลรายการทั้งหมด
app.get('/purchases', (req, res) => {
  db.query('SELECT * FROM purchases', (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});

// เพิ่มรายการใหม่
app.post('/purchases', (req, res) => {
  const { name, qty, unit, price, friendly, month, department } = req.body;
  db.query('INSERT INTO purchases (name, qty, unit, price, friendly, month, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, qty, unit, price, friendly ? 1 : 0, month, department],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.json({ message: 'Item added successfully', id: result.insertId });
    }
  );
});

// (จะมีเพิ่ม API ลบ/แก้ไขได้ด้วย ถ้าอยากทำต่อ)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
