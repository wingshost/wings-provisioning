const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Konfigurasi Panel Pterodactyl Kakak
const PTERODACTYL_URL = 'https://serv.wingsserver.my.id';
const API_KEY = 'ptla_GANTI_DENGAN_API_KEY_ANDA_YANG_ASLI'; // Ganti dengan ptla_... asli Kakak

// Mapping Egg & Node sesuai permintaan Kakak (Bot masuk Node 20, Game pilih egg)
const CONFIG_MAPPING = {
    'nodejs20': { eggId: 5, nestId: 1, defaultNode: 20 },
    'python':   { eggId: 6, nestId: 1, defaultNode: 20 },
    'minecraft':{ eggId: 2, nestId: 2, defaultNode: 1 },
    'samp':     { eggId: 14, nestId: 3, defaultNode: 1 }
};

app.post('/api/create-server', async (req, res) => {
    try {
        const { username, email, paket, eggType } = req.body;

        const selectedConfig = CONFIG_MAPPING[eggType] || CONFIG_MAPPING['nodejs20'];
        const targetNode = selectedConfig.defaultNode;

        // 1. Buat User baru otomatis di Pterodactyl
        const passwordRandom = 'P@ss' + Math.random().toString(36).substring(2, 8) + '!';
        const userResponse = await fetch(`${PTERODACTYL_URL}/api/application/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                username: username,
                first_name: "Buyer",
                last_name: "WingsServer",
                password: passwordRandom
            })
        });

        const userData = await userResponse.json();
        
        let userId;
        if (userResponse.ok) {
            userId = userData.attributes.id;
        } else {
            return res.status(400).json({ 
                success: false, 
                message: "Gagal membuat user panel. Kemungkinan email sudah terdaftar.",
                details: userData 
            });
        }

        // 2. Buat Server otomatis di Pterodactyl API
        const serverResponse = await fetch(`${PTERODACTYL_URL}/api/application/servers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: `${paket} - ${username}`,
                user: userId,
                egg: selectedConfig.eggId,
                nest: selectedConfig.nestId,
                docker_image: "ghcr.io/pterodactyl/yolks:nodejs_20",
                startup: "npm start",
                limits: {
                    memory: 2048,
                    swap: 0,
                    disk: 20480,
                    io: 500,
                    cpu: 100
                },
                feature_limits: {
                    databases: 1,
                    backups: 1,
                    allocations: 1
                },
                allocation: {
                    default: null
                },
                deploy: {
                    locations: [],
                    dedicated_ip: false,
                    port_range: []
                },
                start_on_completion: true
            })
        });

        const serverData = await serverResponse.json();

        if (serverResponse.ok) {
            return res.status(200).json({
                success: true,
                message: "Server berhasil dibuat di Pterodactyl!",
                credentials: {
                    username: username,
                    password: passwordRandom,
                    panelUrl: "serv.wingsserver.my.id",
                    serverName: serverData.attributes.name
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Gagal membuat server di Pterodactyl.",
                details: serverData
            });
        }

    } catch (error) {
        console.error("Error Backend:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan internal pada server backend." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend Wings Server berjalan di port ${PORT}`);
});