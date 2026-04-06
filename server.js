require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const path = require('path');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cors());

// PORT cho Render
const PORT = process.env.PORT || 4000;

// Route trang chủ
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Nội dung hệ thống
const SYSTEM = {
  role: "system",
  content: `
Bạn là Mai — chuyên gia tư vấn sữa của MilkStore.

Nhiệm vụ:
- Tư vấn sản phẩm sữa phù hợp
- Hỏi thêm thông tin nếu chưa đủ (tuổi, nhu cầu, ngân sách)
- Gợi ý sản phẩm cụ thể
- Luôn lịch sự, thân thiện, ngắn gọn

Phong cách:
- Xưng "mình" - "bạn"
- Thêm emoji nhẹ (😊)

Khi tư vấn:
- Nếu khách hỏi chung chung → hỏi lại
- Nếu rõ nhu cầu → đề xuất 1-3 sản phẩm

Upsell:
- Nếu phù hợp → gợi ý mua nhiều hơn hoặc sản phẩm liên quan

Kết thúc:
- Luôn hỏi: "Bạn có muốn mình đặt hàng luôn không ạ?"
`
};

// Session lưu trữ
const sessions = {};

// API chat
app.post('/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Thiếu sessionId hoặc message" });
    }

    if (!sessions[sessionId]) {
      sessions[sessionId] = [{ role: 'system', content: SYSTEM.content }];
    }

    sessions[sessionId].push({ role: 'user', content: message });

    // Gọi API Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: sessions[sessionId],
      max_tokens: 500
    });

    const reply = response.choices[0].message.content;

    sessions[sessionId].push({ role: 'assistant', content: reply });

    res.json({
      reply: reply,  // sửa lỗi aiReply
      products: [
        { id: 1, name: "Sữa Vinamilk 1L", price: 30000 },
        { id: 2, name: "Sữa TH True Milk 1L", price: 35000 }
      ]
    });

  } catch (err) {
    console.error("Lỗi:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Chạy server
app.listen(PORT, () => {
  console.log(`MilkBot đang chạy tại port ${PORT}`);
});