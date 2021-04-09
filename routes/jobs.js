"use strict";

/** Routes for jobs */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");


const router = new express.Router();

/** POST / {job} => {job}
 * job should be { title, companyHandle, salary, equity }
 * returns { id, title, companyHandle, salary, equity }
 * Auth required: admin
*/ 

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
        } catch (err) {
        return next(err);
        }
    });

/** GET / =>
 *   { jobs: [ { id, title, salary, equity, companyHandle, companyName }, ...] }
 *
 * Can provide search filter in query:
 * - minSalary
 * - hasEquity (true returns only jobs with equity > 0, other values ignored)
 * - title (will find case-insensitive, partial matches)

 * Authorization required: none
 */

router.get("/", async (req, res, next) => {
    const q = req.query;
    // convert query into int and boolean
    if(q.minSalary !== undefined) q.minSalary = +q.minSalary;
    q.hasEquity = q.hasEquity === "true";

    try{
        const validator = jsonschema.validate(q, jobSearchSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

    const jobs = await Job.findAll(q);
    return res.json({ jobs })
    }catch(e){
        return next(e)
    }
})

/** GET /[jobId] => { job }
 *  
 * Returns { id, title, salary, equity, comppany}
 *      where company is { handle, name, description, numEmployees, logoUrl }
 * 
 * Auth: none
 */


router.get("/:id", async (req, res, next) => {
    try{
        const job = await Job.get(req.params.id);
        return res.json({ job })
    } catch(e){
        return next(e)
    }
})



module.exports = router;