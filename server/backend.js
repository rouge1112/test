const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());

const db = new sqlite3.Database('flowchart.db');

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS nodes (id INTEGER PRIMARY KEY, label TEXT, x INTEGER, y INTEGER)');
  db.run('CREATE TABLE IF NOT EXISTS edges (id INTEGER PRIMARY KEY, source INTEGER, target INTEGER)');
});

app.get('/api/nodes', (req, res) => {
  db.all('SELECT * FROM nodes', [], (err, rows) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/nodes', (req, res) => {
  const { label, x, y } = req.body;
  db.run('INSERT INTO nodes (label, x, y) VALUES (?, ?, ?)', [label, x, y], function (err) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ id: this.lastID, label, x, y });
    }
  });
});

app.delete('/api/nodes', (req, res) => {
  db.run('DELETE FROM nodes', [], (err) => {
    if (err) {
      res.status(500).send(err);
    } else {
      db.run('DELETE FROM edges', [], (err) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

app.get('/api/edges', (req, res) => {
  db.all('SELECT * FROM edges', [], (err, rows) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/edges', (req, res) => {
  const { source, target } = req.body;
  db.run('INSERT INTO edges (source, target) VALUES (?, ?)', [source, target], function (err) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ id: this.lastID, source, target });
    }
  });
});

app.get('/api/ping', (req, res) => {
  res.send('ping');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
