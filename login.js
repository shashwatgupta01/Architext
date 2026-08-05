const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const formidable = require('formidable');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/profileview.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'profileview.html'));
});

app.get('/people.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'people.html'));
});

app.get('/blog.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'blog.html'));
});

app.get('/videos.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'videos.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'Login',
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
        return;
    }
    console.log('Connected to the MySQL database.');
});

app.post('/register', (req, res) => {
    const { username, password, email, name, profile_pic } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const query = 'INSERT INTO UserPass (username, password, email, name, profile_pic, followers, following) VALUES (?, ?, ?, ?, ?, 0, 0)';

    db.query(query, [username, password, email || null, name || null, profile_pic || null], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Username already exists' });
            }
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});

app.put('/edit-profile', (req, res) => {
    const { username, newUsername, name, email, profile_pic, password } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Current username is required' });
    }

    if (password === "") {
        return res.status(400).json({ message: 'Password cannot be empty' });
    }

    const query = `UPDATE UserPass SET 
        username = COALESCE(?, username),
        name = COALESCE(?, name), 
        profile_pic = COALESCE(?, profile_pic), 
        email = COALESCE(?, email),
        password = COALESCE(?, password) 
        WHERE username = ?`;

    db.query(query, [newUsername, name, profile_pic, email, password, username], (err, result) => {
        if (err) {
            console.error('Error updating profile:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Profile updated successfully' });
    });
});

app.post('/add-blog', (req, res) => {
    const { username, title, content, keywords, image } = req.body;

    if (!username || !title || !content) {
        return res.status(400).json({ message: 'Username, title, and content are required' });
    }

    const query = 'INSERT INTO Blogs (username, title, content, keywords, image) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [username, title, content, keywords || null, image || null], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ message: 'Blog added successfully' });
    });
});

app.get('/blogs/:username', (req, res) => {
    const { username } = req.params;
    const query = 'SELECT * FROM Blogs WHERE username = ? LIMIT 10';

    db.query(query, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.get('/blogs', (req, res) => {
    const query = 'SELECT id, username, title, content, keywords, image FROM Blogs';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching blogs:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.get('/search-blogs', (req, res) => {
    const { keyword } = req.query;
    if (!keyword) {
        return res.status(400).json({ message: 'Keyword is required' });
    }

    const query = 'SELECT * FROM Blogs WHERE keywords LIKE ?';
    db.query(query, [`%${keyword}%`], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.get('/search-videos', (req, res) => {
    const { keyword } = req.query;
    if (!keyword) {
        return res.status(400).json({ message: 'Keyword is required' });
    }

    const query = 'SELECT * FROM Videos WHERE keywords LIKE ?';
    db.query(query, [`%${keyword}%`], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.delete('/delete-blog/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM Login.Blogs WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting blog post:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.status(200).json({ message: 'Blog post deleted successfully' });
    });
});

app.post('/like-blog', (req, res) => {
    const { username, blogId } = req.body;

    if (!username || !blogId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const checkQuery = 'SELECT COUNT(*) AS count FROM BlogLikes WHERE blogId = ? AND username = ?';
    db.query(checkQuery, [blogId, username], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (results[0].count > 0) {
            return res.status(409).json({ message: 'You have already liked this blog.' });
        }

        const insertQuery = 'INSERT INTO BlogLikes (blogId, username) VALUES (?, ?)';
        db.query(insertQuery, [blogId, username], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            }
            res.status(201).json({ message: 'Blog liked successfully' });
        });
    });
});

app.get('/blog-likes/:blogId', (req, res) => {
    const { blogId } = req.params;
    const query = 'SELECT username FROM BlogLikes WHERE blogId = ?';

    db.query(query, [blogId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.post('/send-message', (req, res) => {
    const { sender, receiver, message } = req.body;
    if (!sender || !receiver || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = 'INSERT INTO Messages (sender, receiver, message) VALUES (?, ?, ?)';
    db.query(query, [sender, receiver, message], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ message: 'Message sent successfully' });
    });
});

app.delete('/delete-message/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM Login.Messages WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting message:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.status(200).json({ message: 'Message deleted successfully' });
    });
});

app.get('/profile/:username', (req, res) => {
    const { username } = req.params;

    if (!username) {
        console.error('Profile fetch error: Username is missing in the request');
        return res.status(400).json({ message: 'Username is required' });
    }

    console.log('Fetching profile for username:', username);

    const query = 'SELECT username, email, name, profile_pic, followers, following FROM UserPass WHERE username = ?';

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error fetching profile from database:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (!results || results.length === 0) {
            console.error('Profile fetch error: User not found for username:', username);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('Profile fetched successfully for username:', username, results[0]);
        res.status(200).json(results[0]);
    });
});

app.get('/blogs', (req, res) => {
    const query = 'SELECT id, username, title, content, keywords, image FROM Blogs';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching blogs:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.get('/blog-likes/:blogId', (req, res) => {
    const { blogId } = req.params;
    const query = 'SELECT username FROM BlogLikes WHERE blogId = ?';

    db.query(query, [blogId], (err, results) => {
        if (err) {
            console.error('Error fetching blog likes:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.get('/messages/:sender/:receiver', (req, res) => {
    const { sender, receiver } = req.params;
    const query = 'SELECT id, sender, receiver, message, timestamp FROM Messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY timestamp';

    db.query(query, [sender, receiver, receiver, sender], (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const query = 'SELECT * FROM UserPass WHERE username = ? AND password = ?';

    console.log('Executing query:', query, 'with values:', username, password);

    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        console.log('Query results:', results);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const loggedInUser = results[0];
        res.status(200).json({ message: 'Login successful', user: loggedInUser });
    });
});

app.get('/all-users', (req, res) => {
    const query = 'SELECT username, profile_pic, name, followers, following FROM UserPass WHERE username != ?';
    const currentUser = req.query.currentUser;

    if (!currentUser) {
        return res.status(400).json({ message: 'Current user is required' });
    }

    db.query(query, [currentUser], (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.delete('/delete-blog/:id', (req, res) => {
    const { id } = req.params;
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const deleteLikesQuery = 'DELETE FROM BlogLikes WHERE blogId = ?';
    db.query(deleteLikesQuery, [id], (err) => {
        if (err) {
            console.error('Error deleting related likes:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        const deleteBlogQuery = 'DELETE FROM Blogs WHERE id = ? AND username = ?';
        db.query(deleteBlogQuery, [id, username], (err, result) => {
            if (err) {
                console.error('Error deleting blog post:', err);
                return res.status(500).json({ message: 'Database error', error: err });
            }
            if (result.affectedRows === 0) {
                return res.status(403).json({ message: 'You are not authorized to delete this blog post or it does not exist.' });
            }
            res.status(200).json({ message: 'Blog post deleted successfully' });
        });
    });
});

app.post('/add-comment', (req, res) => {
    const { blogId, username, comments } = req.body;

    if (!blogId || !username || !comments) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = 'INSERT INTO BlogComments (blogId, username, comments) VALUES (?, ?, ?)';

    db.query(query, [blogId, username, comments], (err, result) => {
        if (err) {
            console.error('Error adding comment:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({ message: 'Comment added successfully' });
    });
});

app.get('/comments/:blogId', (req, res) => {
    const { blogId } = req.params;

    const query = 'SELECT username, comments FROM BlogComments WHERE blogId = ?';

    db.query(query, [blogId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(results);
    });
});

app.delete('/delete-chat', (req, res) => {
    const { sender, receiver } = req.body;

    if (!sender || !receiver) {
        return res.status(400).json({ message: 'Sender and receiver are required' });
    }

    const query = 'DELETE FROM Messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)';

    db.query(query, [sender, receiver, receiver, sender], (err, result) => {
        if (err) {
            console.error('Error deleting chat:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No chat found between the specified users' });
        }
        res.status(200).json({ message: 'Chat deleted successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
