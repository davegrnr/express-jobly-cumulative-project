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
            `INSERT INTO jobs (title, companyHandle, salary, equity)
            VALUES ($1, $2, $3, $4)
            RETURNING title, companyHandle, salary, equity`,
            [title, companyHandle, salary, equity]);

            const job = result.rows[0];
            
            return job;
    }

    


}