const express=require('express');
const bodyParser=require('body-parser');
const cors=require('cors');
const	bcrypt=require('bcrypt-nodejs')



const app=express();

app.use(bodyParser.json());
app.use(cors());

const ms=require('knex')({
	client:'mssql',
	connection:{
        server: '127.0.0.1', //ip address of the mssql database
        user: 'sa', //username to login to the database
        password: '123456', //password to login to the database
        database: 'FaceDetction', //the name of the database to connect to
        
       port: 1433, //OPTIONAL, port of the database on the server
       	option:{
       		encrypt:true
       	}
   	}
});

app.get('/',(req,res)=>{
	res.send(database.users);
})

app.post('/signin',(req,res)=>{
	ms.select('email','hash').from('login')
	.where('email','=',req.body.email)
	.then(data=>{
		const isValid=bcrypt.compareSync(req.body.password,data[0].hash);
		if(isValid){
			return ms.select('*').from('Users')
			.where('email','=',req.body.email)
			.then(user=>{
				res.json(user[0])
			})
			.catch(err=>res.status(400).json('Unable to get user'))
		}else{
			res.status(400).json('wrong credentials')
		}
	})
	.catch(err=>res.status(400).json('wrong crdentials'))
})
app.post('/register',(req,res)=>{
	const {email,password,name}=req.body;
	const hash=bcrypt.hashSync(password);
	ms.transaction(trx=>{
		trx.insert({
			hash:hash,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginEmail=>{
			return trx('Users')
				.returning('*')
				.insert({
					email:email,
					name:name,
					entries:0,
					joined:new Date()
				})
				.then(user=>{
					console.log(user[0]);
					res.json(user[0]);
				})
			
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err=>res.status(404).json('Unable to register'))
})

app.post('/profile/:id',(req,res)=>{
	const {id}=req.params;
	ms.select('*').from('Users').where({id})
		.then(user=>{
			if(user.length){
				res.json(user[0])
			}else{
				res.status(400).json('User not found')
			}
		})
		.catch(err=>res.status(404).json('error	getting	user'))
})

app.put('/image',(req,res)=>{
	const {id}=req.body;
	ms('Users').where('id','=',id)
	.increment('entries',1)
	.returning('entries')
	.then(entries=>{
		res.json(entries[0]);
	})
	.catch(err=>res.status(404).json('unable to get entries'))
})

app.listen(3001,()=>{
	console.log("app is running on port 3001");
})