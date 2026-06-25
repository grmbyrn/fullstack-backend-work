import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

router.post('/register', (req, res) => {
    // Register a new user endpoint /auth/register
    // save the username and an irreversibly encrypted password
    const {username, password} = req.body

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' })
    }

    try {
        // encrypt the password
        const hashedPassword = bcrypt.hashSync(password, 8)

        // Save the new user and hashed password to the db
        const insertUser = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`)
        const result = insertUser.run(username, hashedPassword)

        // now that we have a user, i want to add their first todo for them
        const defaultTodo = `Hello! Add your first todo.`
        const insertTodo = db.prepare(`INSERT INTO todos (user_id, task) VALUES(?, ?)`)
        insertTodo.run(result.lastInsertRowid, defaultTodo)

        // create a token
        const token = jwt.sign({id: result.lastInsertRowid}, process.env.JWT_SECRET, {expiresIn: '24h'})
        res.status(201).json({token})
    } catch (error) {
        console.log(error.message)

        if (error.message.includes('UNIQUE constraint failed: users.username')) {
            return res.status(409).json({ message: 'Username already exists' })
        }

        res.status(500).json({ message: 'Unable to register user' })
    }
})

router.post('/login', (req, res) => {
    // we get their email, and we look up the password associated with that email in the database
    // but we get it back and see it's encrypted, which means that we can't compare it to the one the user just used trying to login
    // so what we can do is again one way encrypt the password the user just entered
    const {username, password} = req.body

    try {
        const getUser = db.prepare('SELECT * FROM users WHERE username = ?')
        const user = getUser.get(username)

        // if we can't find a user associated with that username, return out from that function
        if(!user){
            return res.status(404).send({message: "User not found"})
        }

        // returns a boolean
        const passwordIsValid = bcrypt.compareSync(password, user.password)

        // if the password doesn't match, return out of the function
        if(!passwordIsValid){
            return res.status(401).send({message: "Invalid password"})
        }
        console.log(user);

        // then we have a successful implementation
        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '24h'})
        res.send({token})
    } catch (error) {
        console.log(error.message)
        res.sendStatus(503)
    }
})

export default router