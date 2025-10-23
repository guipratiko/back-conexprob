import mongoose from 'mongoose';

const testConnection = async () => {
  const uri = 'mongodb://conexprob:GdFegw4VFdw42567F@easy.clerky.com.br:27020/conex-prob?retryWrites=true&w=majority&appName=Cluster0';
  
  console.log('🔍 Testando conexão com MongoDB...');
  console.log('📍 Host: easy.clerky.com.br:27020');
  console.log('👤 Usuário: conexprob');
  console.log('🗄️  Banco: conex-prob');
  console.log('');

  try {
    await mongoose.connect(uri);
    console.log('✅ CONEXÃO BEM-SUCEDIDA!');
    console.log('');
    console.log('📊 Informações da conexão:');
    console.log('   - Estado:', mongoose.connection.readyState);
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Porta:', mongoose.connection.port);
    console.log('   - Banco:', mongoose.connection.name);
    
    await mongoose.connection.close();
    console.log('');
    console.log('✅ Conexão fechada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.log('❌ ERRO NA CONEXÃO!');
    console.log('');
    console.log('Detalhes do erro:');
    console.log('   - Tipo:', error.name);
    console.log('   - Mensagem:', error.message);
    console.log('   - Código:', error.code);
    console.log('');
    
    if (error.message.includes('Authentication failed')) {
      console.log('🔐 POSSÍVEIS CAUSAS:');
      console.log('   1. Usuário ou senha incorretos');
      console.log('   2. Usuário não tem permissão no banco "conex-prob"');
      console.log('   3. Banco de dados não existe');
      console.log('');
      console.log('💡 SUGESTÕES:');
      console.log('   - Verifique o usuário e senha no MongoDB');
      console.log('   - Confirme que o usuário tem acesso ao banco "conex-prob"');
      console.log('   - Tente conectar sem especificar o banco (remova /conex-prob)');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('🌐 POSSÍVEIS CAUSAS:');
      console.log('   1. Servidor MongoDB offline ou inacessível');
      console.log('   2. Host ou porta incorretos');
      console.log('   3. Firewall bloqueando a conexão');
    }
    
    process.exit(1);
  }
};

testConnection();

