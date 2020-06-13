const mongoose = require("mongoose");
const User = mongoose.model("User");
const enviarEmailRecovery = require("../helpers/email-recovery");

class UserController {
  //Get
  index(req, res, next) {
    User.findById(req.payload.id).then(usuario => {
      if(!usuario) return res.status(401).json({ errors: "Usuário não encontrado" });
      return res.json({ usuario: usuario.seedAuthJSON() });
    }).catch(next);
  }

  //Get id
  index(req, res, next) {
    User.findById(req.params.id).populate({ path: "loja" })
    .then(usuario => {
      if(!usuario) return res.status(401).json({ errors: "Usuário não encontrado" });
      return res.json({
        usuario: {
          name: usuario.name,
          email: usuario.email,
          role: usuario.role,
          loja: usuario.loja
        }
      });
    }).catch(next);
  }

  //Post /registrar
  store(req, res, next) {
    const {name, email, password } = req.body;

    const usuario = new User({name, email});
    usuario.setPassword(password);

    usuario.save()
    .then(() => res.json({ usuario: usuario.seedAuthJSON() }))
    .catch(next);
  }

  //Put
  store(req, res, next) {
    const {name, email, password } = req.body;

    if( !name || !email || !password) return res.status(422).json({ errors: "Preencha todos os campos" });

    const usuario = new User({name, email, password});
    User.findById(req.payload.id).then((usuario) => {
      if(!usuario) return res.status(401).json({ errors: "Usuário não encontrado" });
      if(typeof name !== "undefined") usuario.name = name;
      if(typeof email !== "undefined") usuario.email = name;
      if(typeof password !== "undefined") usuario.setPassword(password);

      return usuario.save().then(() => {
        return res.json({ usuario: usuario.seedAuthJSON() });
      }).catch(next);
    }).catch(next);
  }

  //Delete
  remove(req, res, next) {
    User.findById(req.payload.id).then(usuario => {
      if(!usuario) return res.status(401).json({ errors: "Usuário não encontrado" });
      return usuario.remove().then(() => {
        return res.json({ deletado: true });
      }).catch(next);
    }).catch(next);
  }

  //POST /login
  login(req, res, next) {
    const {email, password } = req.body;
    if(!email) return res.status(422).json({ errors: {email: "Não pode ser nulo"} });
    if(!password) return res.status(422).json({ errors: {password: "Não pode ser nulo"} });
    User.findOne({ email }).then((usuario) => {
      if(!usuario) return res.status(401).json({ errors: "Usuário não encontrado" });
      if(!usuario.validatePassword) return res.status(401).json({ errors: "Senha inválida" });
      return res.json({ usuario: usuario.seedAuthJSON() });
    }).catch(next);
  }

  //Recovery

  //Get /recuperar-senha
  showRecovery(req, res, next) {
    return res.render('recovery', { error: null, success: null });
  }

  //post /recuperar-senha
  createRecovery(req, res, next) {
    const { email } = req.body;
    if(!email) return res.render('recovery', { error: "Preencha com seu email", success: null });

    User.findOne({ email }).then((usuario) => {
      if(!usuario) return res.render("recovery", { error: "Não existe usuário com esse e-mail", success: null });
      const recoveryData = usuario.createTokenRecoveryPassword();
      return usuario.save().then(() => {
        return res.render("recovery", { error: null, success: true });
      }).catch(next);
    }).catch(next);
  }

  //get /recuperar-senha
  showCompleteRecovery(req, res, next) {
    if(!req.query.token) return res.render('recovery', { error: "Token não identificado", success: null });

    User.findOne({"recovery.token": req.query.token}).then(usuario =>{
      if(!usuario) return res.render("recovery", { error: "Não existe usuário com esse token", success: null });
      if(new Date(usuario.recovery.date) < new Date() ) return res.render("recovery", { error: "Token expirado. Tente novamente", success: null });
      return res.render("recovery/store", { error: null, success: null, token: res.query.token });
    }).catch(next)
  }

  //post /recuperar-senha
  completeRecovery(req, res, next) {
    const { token, password } = req.body;
    if(!token || !password) return res.render('recovery/store', { error: "Preencha novamente", success: null });
    User.findOne({ "recovery.token": token }).then(usuario => {
      if(!usuario) return res.render("recovery", { error: "Usuário não identificado", success: null });
      usuario.finishRecoveryToken();
      usuario.setPassword(password);
      return usuario.save().then(() => {
        return res.render("recovery/store", {
          error: null,
          success: "Senha alterada com sucesso",
          token: null
        });
      }).catch(next)
    })
  }
}