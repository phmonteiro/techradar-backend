import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import bodyParser from 'body-parser'
//import('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());


// Database configuration for Azure SQL Server
const dbConfig = {
  user: 'sqlroot',           // Your DB username
  password: ':.9Qpc:4KuH6VfH',       // Your DB password
  server: 'pettracker.database.windows.net', // Your server name
  port: 1433,                          // The port you're using (1143)
  database: 'techradar',       // Your database name
  options: {
    keepAlive: true,
    encrypt: true,                     // Azure SQL requires encryption
    enableArithAbort: true
  }
};
// Connect to the database when the server starts
connectToDatabase();

// Global SQL connection pool
let poolPromise;

async function connectToDatabase() {
    try {
        poolPromise = await sql.connect(dbConfig);
        console.log('Connected to the database');
    } catch (err) {
        console.error('Database connection failed: ', err);
    }
}

app.get('/api/Technologies', async (req, res) => {
  try {
    const Technologies = await getTechnologies();
    console.log(Technologies)
    res.json(Technologies);  // Return the rows to the client
  } catch (error) {
    console.error('SQL Query Error:', error);
    res.status(500).send("Error querying database");
  }
});

app.post('/api/updateClauseText', async (req, res) => {

  try {
    const { id, texto } = req.body;
    console.log("id: "+id+" texto: "+texto);
    
      // Connect to the Azure SQL Server
      const pool = await sql.connect(dbConfig);
    
      // Execute the SQL query
      //const testquery = await pool.request().query(`UPDATE Technologies SET texto = 'texto' WHERE id = '1'`); 
      const result = await pool.request().query(`UPDATE Technologies SET texto = '`+texto+`' WHERE id = '`+id+`'`);
      
      // Log the results
      return result.recordset;
  } catch (error) {
      console.error('Error updating texto:', error);
      res.status(500).send('Server error');
  }
});


async function getTechnologies() {
  try {
    // Connect to the Azure SQL Server
    const pool = await sql.connect(dbConfig);
    
    // Execute the SQL query
    const result = await pool.request().query('SELECT * FROM Technologies');
    
    // Log the results
    return result.recordset;
  } catch (err) {
    console.log('Database connection or query failed:', err);
  } finally {
    // Close the connection when done
    await sql.close();
  }
}

app.get('/api/testText', async (req, res) => {
  try {
    // Connect to the Azure SQL Server
    const pool = await sql.connect(dbConfig);

    // Execute the SQL query
    const result = await pool.request().query('SELECT * FROM Teste');

    res.json(result);  // Return the rows to the client
  } catch (error) {
    console.error('SQL Query Error:', error);
    res.status(500).send("Error querying database");
  }
});

app.post('/api/updateTest', async (req, res) => {

  try {
    const { id, text } = req.body;
      // Connect to the Azure SQL Server
      const pool = await sql.connect(dbConfig);
    
      // Execute the SQL query
      //const testquery = await pool.request().query(`UPDATE Technologies SET texto = 'texto' WHERE id = '1'`); 
      const result = await pool.request().query(`UPDATE Teste SET text = '`+text+`' WHERE id = '`+id+`'`);
      
      // Log the results
      return result.recordset;
  } catch (error) {
      console.error('Error updating text:', error);
      res.status(500).send('Server error');
  }
});

app.post('/api/updateClauseTextOld', async (req, res) => {
  const { id, texto } = req.body;

  if (!id || !texto) {
      return res.status(400).send('id and texto are required');
  }

  try {
    const request = poolPromise.request(); // Use the pool connection

    // SQL query to update [texto] field by id
    const query = `UPDATE Technologies SET texto = @texto WHERE id = @id`;
    
    // Set input parameters
    request.input('id', sql.Int, id);
    request.input('texto', sql.NVarChar(sql.MAX), texto);

    // Execute the query
    const result = await request.query(query);

    res.status(200).send('Texto updated successfully');
    console.log(result)
    console.log("######################")                 
    console.log(res)
  } catch (error) {
      console.error('Error updating texto:', error);
      res.status(500).send('Server error');
  }
});

app.post('/api/updateClauseTextOld', async (req, res) => {
  const { id, texto } = req.body;

  if (!id || !texto) {
      return res.status(400).send('id and texto are required');
  }

  try {
    const request = poolPromise.request(); // Use the pool connection

    // SQL query to update [texto] field by id
    const query = `UPDATE Technologies SET texto = @texto WHERE id = @id`;
    
    // Set input parameters
    request.input('id', sql.Int, id);
    request.input('texto', sql.NVarChar(sql.MAX), texto);

    // Execute the query
    const result = await request.query(query);

    res.status(200).send('Texto updated successfully');
    console.log(result)
    console.log("######################")                 
    console.log(res)
  } catch (error) {
      console.error('Error updating texto:', error);
      res.status(500).send('Server error');
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
