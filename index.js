
// Login endpoint(Okay but we should add all the fields in the database)
app.post('/api/v1/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM se_project.users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      res.status(401).json('Invalid Credentials!');
    } else {
      const validPassword = await pool.query('SELECT * FROM se_project.users WHERE email = $1 AND password = $2', [email, password]);
      if (validPassword.rows.length === 0) {
        res.status(401).json('Invalid Credentials!');
      } else {
        res.json(user.rows[0]);
      }
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
});

// User registration endpoint
app.post('/api/v1/users/register', async (req, res) => {
  try {
    const { firstname, lastname, email, password, roleid } = req.body;
    const user = await pool.query('SELECT * FROM se_project.users WHERE email = $1', [email]);
    if (user.rows.length > 0) {
      res.status(401).json('User already exists!');
    }
    const newUser = await pool.query('INSERT INTO se_project.users (firstname, lastname, email, roleid, password) VALUES ($1, $2, $3, $4, $5) RETURNING *', [firstname, lastname, email, roleid, password]);
    res.json(newUser.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
});

// Dashboard endpoint

// Start server
app.listen(2000);
