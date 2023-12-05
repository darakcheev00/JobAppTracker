"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const emailController_1 = require("./emailController");
const cors = require("cors");
const pool = require('./db');
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
app.use(cors());
app.use(express_1.default.json());
pool.connect()
    .then(() => console.log("Connected to the database"))
    .catch(() => console.error("Failed to connect to database"));
app.get('/', (req, res) => {
    res.send('home');
});
app.get('/auth/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // sign in
}));
app.get('/emails/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const result = yield pool.query("SELECT * FROM email WHERE userId = $1", [userId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error executing query', err);
        res.status(500).json('Internal server error');
    }
}));
app.get('/emails/new/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const new_emails = (0, emailController_1.refreshEmails)(userId, pool);
    res.json(new_emails);
}));
app.get('/invalid-senders/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get list of invalid senders from db
}));
app.listen(port, () => {
    console.log(`[server]: running on port 3000`);
});
