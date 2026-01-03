// Dummy Villages Data
const dummyVillages = [
    {
        name: "Rampur",
        description: "A peaceful village surrounded by green fields and helpful community members.",
        lagion: null, // Pehle user create karne ke baad ObjectId yahan assign karoge
        posts: []
    },
    {
        name: "Sultanpur",
        description: "Historic village known for its temples and traditional festivals.",
        lagion: null,
        posts: []
    },
    {
        name: "Balrampur",
        description: "Modern village with good schools and healthcare facilities.",
        lagion: null,
        posts: []
    },
    {
        name: "Chandanpur",
        description: "Agricultural hub famous for wheat and sugarcane production.",
        lagion: null,
        posts: []
    },
    {
        name: "Kishangarh",
        description: "Small village with close-knit community and beautiful surroundings.",
        lagion: null,
        posts: []
    }
];

// Dummy Users Data
const dummyUsers = [
    {
        username: "rajesh_kumar",
        email: "rajesh@example.com",
        fullName: "Rajesh Kumar",
        phoneNumber: "+91-9876543210",
        village: null // Village ObjectId yahan assign karoge
    },
    {
        username: "priya_sharma",
        email: "priya@example.com",
        fullName: "Priya Sharma",
        phoneNumber: "+91-9876543211",
        village: null
    },
    {
        username: "amit_verma",
        email: "amit@example.com",
        fullName: "Amit Verma",
        phoneNumber: "+91-9876543212",
        village: null
    },
    {
        username: "sunita_devi",
        email: "sunita@example.com",
        fullName: "Sunita Devi",
        phoneNumber: "+91-9876543213",
        village: null
    },
    {
        username: "vikash_singh",
        email: "vikash@example.com",
        fullName: "Vikash Singh",
        phoneNumber: "+91-9876543214",
        village: null
    }
];

module.exports = { dummyVillages, dummyUsers };