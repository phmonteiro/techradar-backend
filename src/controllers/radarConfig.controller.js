import { getDb } from '../config/database.js';

export const getTechnologyRadarConfig = async (req, res) => {
  try {
    const pool = await getDb();
    
    // Query to get the latest date for the config
    const dateResult = await pool.request().query('SELECT MAX(date) as latest_date FROM radar_dates');
    const configDate = dateResult.recordset[0].latest_date || new Date().toISOString().split('T')[0].replace(/-/g, '.');
    
    const entriesResult = await pool.request().query(`
      SELECT quadrant, ring, name, label, link, active, moved
      FROM Technology
      WHERE active = 1
      ORDER BY quadrant, ring, label
    `);
    
    // Format the data to match the config.json structure
    const config = {
      date: configDate,
      entries: entriesResult.recordset.map(entry => {
        const formattedEntry = {
          quadrant: entry.quadrant,
          ring: entry.ring,
          name: entry.name,
          label: entry.label,
          active: entry.active,
          moved: entry.moved
        };
        
        if (entry.link) {
          formattedEntry.link = entry.link;
        }
        
        return formattedEntry;
      })
    };

    return res.json(config);
  } catch (error) {
    console.error('Error fetching radar config:', error);
    return res.status(500).json({ error: 'Failed to fetch radar configuration' });
  }
};

export const getTrendRadarConfig = async (req, res) => {
  try {
    const pool = await getDb();
    
    // Query to get the latest date for the config
    const dateResult = await pool.request().query('SELECT MAX(date) as latest_date FROM radar_dates');
    const configDate = dateResult.recordset[0].latest_date || new Date().toISOString().split('T')[0].replace(/-/g, '.');

    const entriesResult = await pool.request().query(`
      SELECT quadrant, ring, name, label, link, active
      FROM Trend
      WHERE active = 1
      ORDER BY quadrant, ring, label
    `);

    // Format the data to match the config.json structure
    const config = {
      date: configDate,
      entries: entriesResult.recordset.map(entry => {
        const formattedEntry = {
          quadrant: entry.quadrant,
          ring: entry.ring,
          name: entry.name,
          label: entry.label,
          active: entry.active
        };

        if (entry.link) {
          formattedEntry.link = entry.link;
        }

        return formattedEntry;
      })
    };

    return res.json(config);
  } catch (error) {
    console.error('Error fetching trend radar config:', error);
    return res.status(500).json({ error: 'Failed to fetch trend radar configuration' });
  }
};


  
