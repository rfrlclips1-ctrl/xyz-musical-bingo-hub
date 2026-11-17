/* Thin compatibility layer for the previously tested D1 tournament engine.
   Uses Netlify's managed Postgres connection. All statements are parameterized. */
export function createDatabaseAdapter(pool) {
  if (!pool?.query || !pool?.connect) throw new Error('Netlify Database is not configured');
  function convert(text, values=[]) {
    let sql=String(text);
    const ignore=/^\s*INSERT\s+OR\s+IGNORE\s+INTO\s+/i.test(sql);
    if(ignore)sql=sql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i,'INSERT INTO');
    let i=0;
    sql=sql.replace(/\?/g,()=>'$'+(++i));
    if(i!==values.length)throw new Error('Incorrect SQL parameter count');
    if(ignore)sql=sql.replace(/;\s*$/,'')+' ON CONFLICT DO NOTHING';
    return {sql,values};
  }
  function makeStatement(sql,values=[]) {
    const converted=convert(sql,values);
    return {
      sql:converted.sql,values:converted.values,
      async all(){const result=await pool.query(converted.sql,converted.values);return {results:result.rows||[]}},
      async first(){const result=await pool.query(converted.sql,converted.values);return result.rows?.[0]??null},
      async run(){const result=await pool.query(converted.sql,converted.values);return {success:true,changes:result.rowCount??0}},
    };
  }
  return {
    prepare(sql){return {bind(...values){return makeStatement(sql,values)}}},
    async batch(statements) {
      const connection=await pool.connect();
      const results=[];
      try{
        await connection.query('BEGIN');
        for(const stmt of statements){
          const result=await connection.query(stmt.sql,stmt.values);
          results.push({success:true,results:result.rows||[],changes:result.rowCount??0});
        }
        await connection.query('COMMIT');
        return results;
      }catch(e){
        try{await connection.query('ROLLBACK')}catch(rollbackError){console.error('Tournament batch rollback:',rollbackError.message)}
        throw e;
      }finally{connection.release()}
    }
  };
}

