// server.js - simple Express API storing users in users.json
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const app = express();
const DATA_FILE = path.join(__dirname, 'users.json');
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
if(!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({users:[], nextId:1}, null, 2));
function readData(){ return JSON.parse(fs.readFileSync(DATA_FILE)); }
function writeData(d){ fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function hashPassword(pw){ return crypto.createHash('sha256').update(pw).digest('hex'); }
// Register
app.post('/api/register', (req, res)=>{
  const {name, password, wa, avatar} = req.body;
  if(!name || !password) return res.status(400).json({error:'name and password required'});
  const data = readData();
  if(data.users.find(u=>u.name===name)) return res.status(400).json({error:'name already exists'});
  const user = {
    id: data.nextId++,
    name,
    password: hashPassword(password),
    wa: wa || '',
    avatar: avatar || '',
    level: 1,
    score: 0,
    createdAt: new Date().toISOString(),
  };
  data.users.push(user);
  writeData(data);
  const {password:pw, ...out} = user;
  res.json(out);
});
// Login
app.post('/api/login', (req,res)=>{
  const {name,password} = req.body;
  if(!name || !password) return res.status(400).json({error:'name and password required'});
  const data = readData();
  const user = data.users.find(u=>u.name===name && u.password===hashPassword(password));
  if(!user) return res.status(401).json({error:'invalid credentials'});
  const {password:pw, ...out} = user;
  res.json(out);
});
// Get user by id
app.get('/api/user/:id', (req,res)=>{
  const id = Number(req.params.id);
  const data = readData();
  const user = data.users.find(u=>u.id===id);
  if(!user) return res.status(404).json({error:'not found'});
  const {password:pw, ...out} = user;
  res.json(out);
});
// Update user
app.put('/api/user/:id', (req,res)=>{
  const id = Number(req.params.id);
  const updates = req.body;
  const data = readData();
  const idx = data.users.findIndex(u=>u.id===id);
  if(idx===-1) return res.status(404).json({error:'not found'});
  const user = data.users[idx];
  if(updates.name) user.name = updates.name;
  if(updates.wa) user.wa = updates.wa;
  if(updates.avatar) user.avatar = updates.avatar;
  if(typeof updates.level === 'number') user.level = updates.level;
  if(typeof updates.score === 'number') user.score = updates.score;
  if(updates.password) user.password = hashPassword(updates.password);
  data.users[idx] = user;
  writeData(data);
  const {password:pw, ...out} = user;
  res.json(out);
});
// Get all users
app.get('/api/users', (req,res)=>{
  const data = readData();
  const users = data.users.map(u=>{ const {password, ...out} = u; return out; });
  res.json({users});
});
// Delete user
app.delete('/api/user/:id', (req,res)=>{
  const id = Number(req.params.id);
  const data = readData();
  const idx = data.users.findIndex(u=>u.id===id);
  if(idx===-1) return res.status(404).json({error:'not found'});
  data.users.splice(idx,1);
  writeData(data);
  res.json({ok:true});
});
app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));
