'use strict';
const express = require('express');
const crypto = require('node:crypto');
const app = express();
const PORT = Number(process.env.PORT || 3000);
const events = [];
const allowed = new Set(['session_started','card_step_opened','card_step_submitted','otp_step_opened','otp_step_submitted','scenario_completed','scenario_abandoned']);
app.use(express.json({limit:'2kb'}));
app.use(express.static('public'));
function safeText(v, max=32) { return String(v || '').replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,max); }
async function notifyTelegram(e) {
  const token = process.env.BOT_TOKEN;
  const chatId = process.env.ADMIN_CHAT_ID;
  if (!token || !chatId) return;
  const labels = {
    session_started:'Новая учебная сессия', card_step_opened:'Открыт экран карты',
    card_step_submitted:'Тестовая форма карты отправлена', otp_step_opened:'Открыт экран тестового SMS',
    otp_step_submitted:'Введён вымышленный код (сам код не собирается)',
    scenario_completed:'Учебный сценарий завершён', scenario_abandoned:'Сценарий прерван'
  };
  const message = [
    '🎓 VELVET LUXE — УЧЕБНАЯ СИМУЛЯЦИЯ',
    labels[e.type] || 'Учебное событие',
    `Сессия: ${e.session}`,
    `Студент: ${e.student}`,
    `Время: ${e.time}`,
    '',
    'Переданные поля карты/CVV/OTP: НЕТ',
    'Режим: DEMO — значения не сохраняются и не пересылаются.'
  ].join('\n');
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({chat_id:chatId,text:message})
    });
  } catch (err) { console.error('Telegram notification failed:', err.message); }
}
app.post('/api/event', async (req,res) => {
  const type = req.body?.type;
  if (!allowed.has(type)) return res.status(400).json({error:'Unsupported demo event'});
  // Deliberately accept only a student label. No form field values are accepted.
  const student = safeText(req.body?.student || 'Студент', 24) || 'Студент';
  const session = safeText(req.body?.session, 16) || crypto.randomBytes(4).toString('hex').toUpperCase();
  const e = {type,student,session,time:new Date().toLocaleString('ru-RU',{timeZone:'Europe/Kyiv'})};
  events.unshift(e); if (events.length > 100) events.pop();
  await notifyTelegram(e);
  res.json({ok:true});
});
app.get('/api/events',(req,res)=>res.json(events));
app.get('/health',(req,res)=>res.json({ok:true,mode:'isolated-classroom-demo'}));
app.listen(PORT,()=>console.log(`VELVET classroom demo listening on ${PORT}`));
