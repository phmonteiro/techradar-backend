import { getDb } from '../config/database.js';

export const getTechnologyRadarConfig = async (req, res) => {
  try {
    const pool = await getDb();
    
    // Query to get the latest date for the config
    const dateResult = await pool.request().query('SELECT MAX(date) as latest_date FROM radar_dates');
    const configDate = dateResult.recordset[0].latest_date || new Date().toISOString().split('T')[0].replace(/-/g, '.');
    
    const entriesResult = await pool.request().query(`
      SELECT quadrant, ring, name, link, active, moved
      FROM Technology
      WHERE active = 1
      ORDER BY quadrant, ring
    `);
    
    console.log('Raw database results:', entriesResult.recordset.length, 'records');
    console.log('Sample records:', entriesResult.recordset.slice(0, 3));
    
    // Format the data to match the config.json structure
    const filteredEntries = entriesResult.recordset
      .filter(entry => 
        entry.quadrant !== null && entry.quadrant !== undefined &&
        entry.ring !== null && entry.ring !== undefined &&
        entry.quadrant >= 0 && entry.quadrant <= 3 &&
        entry.ring >= 0 && entry.ring <= 3
      );
    
    console.log('Filtered entries:', filteredEntries.length, 'records');
    
    const config = {
      date: configDate,
      entries: filteredEntries.map(entry => {
        const formattedEntry = {
          quadrant: parseInt(entry.quadrant, 10),
          ring: parseInt(entry.ring, 10),
          name: entry.name,
          active: entry.active ? 1 : 0,
          moved: entry.moved || 0
        };
        
        if (entry.link) {
          formattedEntry.link = entry.link;
        }
        
        return formattedEntry;
      })
    };

    console.log('Final config entries:', config.entries.length);
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
      SELECT quadrant, ring, name, link, active
      FROM Trend
      WHERE active = 1
      ORDER BY quadrant, ring
    `);

    // Format the data to match the config.json structure
    const config = {
      date: configDate,
      entries: entriesResult.recordset.map(entry => {
        const formattedEntry = {
          quadrant: entry.quadrant,
          ring: entry.ring,
          name: entry.name,
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


  
