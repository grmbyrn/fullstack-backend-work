import express from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
    const getTodos = db.prepare('SELECT * FROM todos WHERE user_id = ?')
    const todos = getTodos.all(req.userId)
    res.json(todos)
})

router.post('/', (req, res) => {
    const {task} = req.body

    if (!task) {
        return res.status(400).json({ message: 'Task is required' })
    }

    const getUser = db.prepare('SELECT id FROM users WHERE id = ?')
    const user = getUser.get(req.userId)

    if (!user) {
        return res.status(401).json({ message: 'Invalid token or user no longer exists' })
    }

    const insertTodo = db.prepare(`INSERT INTO todos (user_id, task) VALUES(?, ?)`)
    const result = insertTodo.run(req.userId, task)

    res.json({id: result.lastInsertRowid, task, completed: 0})
})

router.put('/:id', (req, res) => {
    const {completed} = req.body
    const {id} = req.params
    const {page} = req.query
    console.log(id)
    console.log(page);

    const updatedTodo = db.prepare('UPDATE todos SET completed = ? WHERE id = ?')
    updatedTodo.run(completed, id)

    res.json({'message': "Todo completed"})
})

router.delete('/:id', (req, res) => {
    const {id} = req.params
    const userId = req.userId

    const deletedTodo = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?')
    deletedTodo.run(id, userId)

    res.send({"message": "Todo deleted"})
})

export default router