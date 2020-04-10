import { createFormEntity, extractFormData } from './form-helper.js'
import { fireBaseRequestFactory } from './firebase-requests.js'
import { requester } from './service.js'

async function applyCommon(){
    this.partials = {
        header: await this.load('./templates/common/header.hbs'),
        post: await this.load('./templates/post/post.hbs'),
        createPost: await this.load('./templates/post/create-post.hbs')
    }

    this.username = sessionStorage.getItem('username');
    this.loggedIn = !!sessionStorage.getItem('token');
    
}

async function homeViewHandler(){
    await applyCommon.call(this);
    /* this.partials = {createPost: await this.load('./templates/post/create-post.hbs')} */
    this.partial('./templates/home/home.hbs');

} 

async function createPost() {
    
    await applyCommon.call(this);

    await this.partial('./templates/create/create-post.hbs');


    let formRef = document.querySelector('form');
    formRef.addEventListener('submit', async e => {
        e.preventDefault();

        let form = createFormEntity(formRef, ['title', 'category', 'comment']);
        let formValue = form.getValue();

        await requester.posts.createEntity(formValue);

        form.clear();
    }); 
}

async function loginHandler(){
    await applyCommon.call(this);
    this.partials.loginForm = await this.load('./templates/login/loginForm.hbs');

    await this.partial('./templates/login/loginPage.hbs');

    let formRef = document.querySelector('#form');

    formRef.addEventListener('submit', e => {
        e.preventDefault();

        let form = createFormEntity(formRef, ['email', 'password']);
        let formValue = form.getValue();

        firebase.auth().signInWithEmailAndPassword(formValue.email, formValue.password)
        .then(response => {

            firebase.auth().currentUser.getIdToken()
            .then(token => {
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('username', response.user.email);

                this.redirect(['#/home']);
            });
            
        }).catch(function(error){
            var errorCode = error.code;
            var errorMessage = error.message;
        })
    })
}

async function registerHandler(){
    await applyCommon.call(this);
    this.partials.registerForm = await this.load('./templates/register/registerForm.hbs');
    
    await this.partial('./templates/register/registerPage.hbs');

    let formRef = document.querySelector('#form');

    formRef.addEventListener('submit', (e) => {
        e.preventDefault();
        let form = createFormEntity(formRef, ['email', 'password', 'repeatPassword']);
        let formValue = form.getValue();

        if(formValue.password !== formValue.repeatPassword){
            window.alert('Passwords did not match!')
            return;
        }

        firebase.auth().createUserWithEmailAndPassword(formValue.email, formValue.password)
        .then(response => {
            
            firebase.auth().currentUser.getIdToken()
            .then(token => {
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('email', response.user.email);

                this.redirect(['#/login']);
            });
        });
    })
}

async function logoutHandler(){
    sessionStorage.clear()
    firebase.auth().signOut();
    this.redirect(['#/home']);
}

// initialize the application
var app = Sammy('#root', function() {
    // include a plugin
    this.use('Handlebars', 'hbs');
  
    // define a 'route'
    this.get('#/', homeViewHandler);
    this.get('#/home', homeViewHandler);
    this.get('#/login', loginHandler);
    this.get('#/register', registerHandler);
    this.post('#/register', () => false);
    this.get('#/logout', logoutHandler);
    this.post('#/login', () => false );
    this.post('/create-post', () => false);
    this.get('/create-post', createPost)
  });
  
  // start the application
  
    app.run('#/');
  
    
  
  