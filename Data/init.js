// seedDatabase.js
const MONGO_URL = "mongodb://127.0.0.1:27017/villageStay";
// seedDatabase.js
// seedDatabase.js
const mongoose = require('mongoose');
const Village = require('../models/village.js');
const User = require('../models/users.js');
const Post = require('../models/posts.js');

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URL);

        // Clear existing data
        await Village.deleteMany({});
        await User.deleteMany({});
        await Post.deleteMany({});

        console.log('🗑️  Existing data cleared...');

        // Step 1: Create villages
        const villages = await Village.insertMany([
            { 
                name: "Rampur", 
                description: "A peaceful village surrounded by green fields and helpful community members.",
                posts: []
            },
            { 
                name: "Sultanpur", 
                description: "Historic village known for its temples and traditional festivals.",
                posts: []
            },
            { 
                name: "Balrampur", 
                description: "Modern village with good schools and healthcare facilities.",
                posts: []
            },
            { 
                name: "Chandanpur", 
                description: "Agricultural hub famous for wheat and sugarcane production.",
                posts: []
            },
            { 
                name: "Krishnapur", 
                description: "Beautiful village near the river with strong cultural heritage.",
                posts: []
            }
        ]);

        console.log(`✅ ${villages.length} villages created`);

        // Step 2: Create users with village references
        const usersData = [
            // Rampur users
            { username: 'rajesh_kumar', email: 'rajesh@example.com', fullName: 'Rajesh Kumar', phoneNumber: '+91-9876543210', villageIndex: 0 },
            { username: 'priya_sharma', email: 'priya@example.com', fullName: 'Priya Sharma', phoneNumber: '+91-9876543211', villageIndex: 0 },
            { username: 'mohit_singh', email: 'mohit@example.com', fullName: 'Mohit Singh', phoneNumber: '+91-9876543212', villageIndex: 0 },
            
            // Sultanpur users
            { username: 'amit_verma', email: 'amit@example.com', fullName: 'Amit Verma', phoneNumber: '+91-9876543213', villageIndex: 1 },
            { username: 'sunita_devi', email: 'sunita@example.com', fullName: 'Sunita Devi', phoneNumber: '+91-9876543214', villageIndex: 1 },
            { username: 'rahul_yadav', email: 'rahul@example.com', fullName: 'Rahul Yadav', phoneNumber: '+91-9876543215', villageIndex: 1 },
            
            // Balrampur users
            { username: 'vikash_singh', email: 'vikash@example.com', fullName: 'Vikash Singh', phoneNumber: '+91-9876543216', villageIndex: 2 },
            { username: 'anjali_gupta', email: 'anjali@example.com', fullName: 'Anjali Gupta', phoneNumber: '+91-9876543217', villageIndex: 2 },
            
            // Chandanpur users
            { username: 'ramesh_yadav', email: 'ramesh@example.com', fullName: 'Ramesh Yadav', phoneNumber: '+91-9876543218', villageIndex: 3 },
            { username: 'kavita_devi', email: 'kavita@example.com', fullName: 'Kavita Devi', phoneNumber: '+91-9876543219', villageIndex: 3 },
            
            // Krishnapur users
            { username: 'suresh_kumar', email: 'suresh@example.com', fullName: 'Suresh Kumar', phoneNumber: '+91-9876543220', villageIndex: 4 },
            { username: 'meena_sharma', email: 'meena@example.com', fullName: 'Meena Sharma', phoneNumber: '+91-9876543221', villageIndex: 4 }
        ];

        const users = [];
        for (let userData of usersData) {
            const user = new User({
                username: userData.username,
                email: userData.email,
                fullName: userData.fullName,
                phoneNumber: userData.phoneNumber,
                village: villages[userData.villageIndex]._id
            });
            await user.setPassword('password123');
            await user.save();
            users.push(user);
        }

        console.log(`✅ ${users.length} users created`);

        // Step 3: Set lagion (village head) for each village
        villages[0].lagion = users[0]._id; // Rajesh Kumar - Rampur
        villages[1].lagion = users[3]._id; // Amit Verma - Sultanpur
        villages[2].lagion = users[6]._id; // Vikash Singh - Balrampur
        villages[3].lagion = users[8]._id; // Ramesh Yadav - Chandanpur
        villages[4].lagion = users[10]._id; // Suresh Kumar - Krishnapur

        // Step 4: Create posts with village reference
        const postsData = [
            // Rampur Posts
            {
                title: "Village Cleaning Drive Tomorrow",
                content: "Dear villagers, we are organizing a cleaning drive tomorrow at 8 AM near the community hall. Please bring your own cleaning tools like brooms and dustpans. Let's make our village beautiful and clean! Your participation matters.",
                author: users[0]._id, // Rajesh Kumar
                village: villages[0]._id,
                comments: [
                    { user: users[1]._id, content: "Great initiative! I'll definitely be there with my family." },
                    { user: users[2]._id, content: "Should we bring our own brooms or will they be provided?" },
                    { user: users[0]._id, content: "Please bring your own tools. See you all tomorrow!" }
                ]
            },
            {
                title: "Water Supply Timing Changed",
                content: "Important announcement: From next week starting Monday, water supply timing will change. Morning: 6 AM to 8 AM, Evening: 6 PM to 8 PM. Please plan your daily activities accordingly and store water if needed.",
                author: users[0]._id, // Rajesh Kumar
                village: villages[0]._id,
                comments: [
                    { user: users[1]._id, content: "Thanks for the update! This is helpful." },
                    { user: users[2]._id, content: "Will this be permanent or temporary?" }
                ]
            },
            {
                title: "Lost Pet - Brown Dog",
                content: "My dog Rocky has been missing since yesterday evening around 6 PM. He is brown colored, medium size, wearing a red collar. Last seen near the temple area. If anyone has seen him, please contact me immediately. Reward available for information.",
                author: users[1]._id, // Priya Sharma
                village: villages[0]._id,
                comments: [
                    { user: users[0]._id, content: "Will keep an eye out. Hope you find Rocky soon!" },
                    { user: users[2]._id, content: "I saw a brown dog near the market this morning. Not sure if it was Rocky though." }
                ]
            },
            {
                title: "Yoga Classes Starting Next Week",
                content: "Free morning yoga classes will start from next Monday at 6 AM in the community ground. Expert instructor from the city will teach. All age groups welcome. Bring your own mat. Let's stay healthy together!",
                author: users[2]._id, // Mohit Singh
                village: villages[0]._id,
                comments: [
                    { user: users[1]._id, content: "This is wonderful! Count me in." }
                ]
            },

            // Sultanpur Posts
            {
                title: "Diwali Celebration Grand Planning",
                content: "We are planning a grand Diwali celebration in our village this year. Looking for volunteers to help with decorations, organizing cultural events, and managing the community dinner. Please come forward and contribute to make this festival memorable!",
                author: users[3]._id, // Amit Verma
                village: villages[1]._id,
                comments: [
                    { user: users[4]._id, content: "Count me in! I can help with decorations and rangoli." },
                    { user: users[5]._id, content: "Great idea! What about organizing a Diwali mela?" },
                    { user: users[3]._id, content: "Excellent suggestion! Let's discuss this in detail." }
                ]
            },
            {
                title: "Free Medical Camp Next Monday",
                content: "Free health check-up camp will be organized next Monday from 9 AM to 4 PM at the village school. Doctors from City Hospital will be available for general check-up, blood pressure monitoring, and diabetes screening. Bring your Aadhar card. Don't miss this opportunity!",
                author: users[3]._id, // Amit Verma
                village: villages[1]._id,
                comments: [
                    { user: users[4]._id, content: "This is much needed! Thank you for organizing." },
                    { user: users[5]._id, content: "Will they provide free medicines too?" }
                ]
            },
            {
                title: "Temple Renovation Update",
                content: "The renovation work of our village temple is progressing well. The new prayer hall will be ready by next month. We still need donations for the final phase. Any contribution big or small will be appreciated. Contact the temple committee for details.",
                author: users[4]._id, // Sunita Devi
                village: villages[1]._id,
                comments: [
                    { user: users[3]._id, content: "The new structure is looking beautiful!" }
                ]
            },
            {
                title: "Street Lights Not Working",
                content: "The street lights near the east side of village have not been working for 3 days. It's getting difficult to walk at night. Can the village head please look into this matter urgently? Safety is important.",
                author: users[5]._id, // Rahul Yadav
                village: villages[1]._id,
                comments: [
                    { user: users[3]._id, content: "I have already contacted the electricity department. They will fix it by tomorrow." },
                    { user: users[5]._id, content: "Thank you for the quick response!" }
                ]
            },

            // Balrampur Posts
            {
                title: "School Admission Started for New Session",
                content: "Admission for the new academic session has started at our village school from today. Parents please visit the school office between 10 AM to 2 PM with required documents - birth certificate, Aadhar card, and previous school records. Limited seats available, first come first serve!",
                author: users[6]._id, // Vikash Singh
                village: villages[2]._id,
                comments: [
                    { user: users[7]._id, content: "What about the fees? Is there any concession for second child?" },
                    { user: users[6]._id, content: "Yes, 25% discount for siblings. Contact school office for details." }
                ]
            },
            {
                title: "Community Hall Now Available for Booking",
                content: "Great news! Our newly renovated community hall is now ready and available for booking for weddings, birthday parties, and other social events. The hall has modern facilities including AC, sound system, and kitchen. Contact the village office for booking and rates.",
                author: users[6]._id, // Vikash Singh
                village: villages[2]._id,
                comments: [
                    { user: users[7]._id, content: "Finally! This is much needed. How much is the booking charge?" }
                ]
            },
            {
                title: "Weekend Football Match",
                content: "Football enthusiasts! We are organizing a friendly football match this Sunday at 5 PM on the village ground. All youth are invited to participate. Let's have some fun and promote sports in our village. Spectators also welcome!",
                author: users[7]._id, // Anjali Gupta
                village: villages[2]._id,
                comments: [
                    { user: users[6]._id, content: "Great initiative for youth! I'll come to watch." }
                ]
            },

            // Chandanpur Posts
            {
                title: "Modern Farming Workshop - Must Attend",
                content: "Agricultural department is conducting a free 2-day workshop on modern farming techniques, organic fertilizers, and new irrigation methods. Date: 20-21 October. Time: 10 AM to 4 PM. Lunch will be provided. All farmers are welcome. This will really help improve our crop yield!",
                author: users[8]._id, // Ramesh Yadav
                village: villages[3]._id,
                comments: [
                    { user: users[9]._id, content: "This will be very helpful for our wheat crops! I'm definitely attending." },
                    { user: users[8]._id, content: "Yes, they will also discuss about pest control methods." }
                ]
            },
            {
                title: "Subsidy Scheme for Farmers",
                content: "Government has announced a new subsidy scheme for purchasing agricultural equipment. Up to 50% subsidy available on tractors, irrigation pumps, and other farming tools. Application deadline is next month. Visit the village office for application forms and details.",
                author: users[8]._id, // Ramesh Yadav
                village: villages[3]._id,
                comments: [
                    { user: users[9]._id, content: "This is great news! What documents are needed for application?" }
                ]
            },
            {
                title: "Village Road Repair Work Starting",
                content: "The main village road repair work will start from next week. There might be some traffic disruptions for 10-15 days. Please cooperate and use alternative routes where possible. The contractor has assured to complete work as soon as possible.",
                author: users[9]._id, // Kavita Devi
                village: villages[3]._id,
                comments: [
                    { user: users[8]._id, content: "Finally! That road was in terrible condition." }
                ]
            },

            // Krishnapur Posts
            {
                title: "River Clean-up Drive This Weekend",
                content: "Our village river needs cleaning. We are organizing a clean-up drive this Saturday at 7 AM. Please come and help remove plastic waste and garbage from the river. Let's protect our natural resources. Gloves and bags will be provided. Breakfast will be served after the drive.",
                author: users[10]._id, // Suresh Kumar
                village: villages[4]._id,
                comments: [
                    { user: users[11]._id, content: "Excellent initiative! Our river has become very polluted. I'll be there." }
                ]
            },
            {
                title: "Cultural Program on Gandhi Jayanti",
                content: "We are organizing a cultural program on Gandhi Jayanti (2nd October) in the village. Students will perform skits, songs, and speeches. All villagers are invited. The program will start at 5 PM at the community center. Let's celebrate together!",
                author: users[11]._id, // Meena Sharma
                village: villages[4]._id,
                comments: [
                    { user: users[10]._id, content: "Looking forward to it! Are you organizing any competitions?" }
                ]
            }
        ];

        const posts = [];
        for (let postData of postsData) {
            const post = await Post.create({
                title: postData.title,
                content: postData.content,
                author: postData.author,
                village: postData.village,
                comments: postData.comments
            });
            posts.push(post);

            // Add post reference to village
            const village = villages.find(v => v._id.equals(postData.village));
            village.posts.push(post._id);
        }

        console.log(`✅ ${posts.length} posts created`);

        // Step 5: Save all villages with updated lagion and posts
        for (let village of villages) {
            await village.save();
        }

        console.log('✅ Villages updated with lagion and posts');

        console.log('\n🎉 Database seeded successfully!\n');
        console.log('📊 Summary:');
        console.log(`   Villages: ${villages.length}`);
        console.log(`   Users: ${users.length}`);
        console.log(`   Posts: ${posts.length}`);
        console.log('\n📍 Village Distribution:');
        console.log(`   Rampur: 3 users, 4 posts`);
        console.log(`   Sultanpur: 3 users, 4 posts`);
        console.log(`   Balrampur: 2 users, 3 posts`);
        console.log(`   Chandanpur: 2 users, 3 posts`);
        console.log(`   Krishnapur: 2 users, 2 posts`);
        console.log('\n🔐 Login Credentials (password for all users: password123):');
        console.log('   - rajesh_kumar (Rampur - Lagion)');
        console.log('   - amit_verma (Sultanpur - Lagion)');
        console.log('   - vikash_singh (Balrampur - Lagion)');
        console.log('   - ramesh_yadav (Chandanpur - Lagion)');
        console.log('   - suresh_kumar (Krishnapur - Lagion)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();