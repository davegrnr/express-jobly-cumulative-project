"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");



class Job {
    /* Creates a job (from data), update db, return new job data.
    
    --Data should be { title, companyHandle, salary, equity }

    --Returns { title, companyHandle, salary, equity }
    */
    
    static async create({ title, companyHandle, salary, equity}) {
        const result = await db.query(
            `INSERT INTO jobs (title, company_handle, salary, equity)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, company_handle AS "companyHandle", salary, equity`,
            [title, companyHandle, salary, equity]);

            const job = result.rows[0];
            
            return job;
    }

    /** Find all jobs (optional filters on searchFilters)
     * searchFilters (all optional):
     * -title
     * -minSalary
     * -hasEquity
     * 
     * Returns [{ id, title, companyHandle, salary, equity }]
     */

    static async findAll(searchFilters = {}){
        let query = `SELECT j.id,
                            j.title,
                            j.salary,
                            j.equity,
                            j.company_handle AS "companyHandle",
                            c.name AS "companyName"
                    FROM jobs j 
                        LEFT JOIN companies AS c ON c.handle = j.company_handle`;
        let whereExpressions = [];
        let queryValues = [];


            // For each possible search term, add to whereExpressions and
            // queryValues so the right SQL is generated

        const { title, minSalary, hasEquity } = searchFilters

        if (title) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
              }

        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
            }
    
        if (hasEquity === true) {
        whereExpressions.push(`equity > 0`);
        }
        
        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        // Finalize query and return results

        query += " ORDER BY title";
        const jobsRes = await db.query(query, queryValues);
        return jobsRes.rows;

    }

    /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

        static async get(id) {
            const jobRes = await db.query(
                `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle as "company_handle"
                FROM jobs
                WHERE id = $1`, [id]);

            const job = jobRes.rows[0];

            if (!job) throw new NotFoundError(`No job with id: ${id}`)

            const companiesRes = await db.query(
                `SELECT handle,
                        name,
                        description,
                        num_employees AS "numEmployees",
                        logo_url AS "logoUrl"
                    FROM companies
                    WHERE handle = $1`, [job.companyHandle]);

            delete job.companyHandle;
            job.company = companiesRes.rows[0];
        
            return job;
                
        }
    
/** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                    title, 
                                    salary, 
                                    equity,
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`, [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}
    


module.exports = Job