# Implementação de Criptografia - Vault

## Visão Geral

Esta implementação adiciona uma camada de criptografia AES-256-GCM aos dados sensíveis do usuário no Vault, garantindo que as credenciais sejam armazenadas de forma segura e descriptografadas apenas no frontend com a senha mestra do usuário.

## Arquitetura de Segurança

### Backend (Node.js + Prisma)

1. **Criptografia AES-256-GCM**: Usa o algoritmo AES-256-GCM para criptografia autenticada
2. **Derivação de Chave PBKDF2**: Deriva chaves criptográficas da senha mestra usando PBKDF2 com 100.000 iterações
3. **Salt Único**: Cada credencial tem seu próprio salt para derivação da chave
4. **IV e Auth Tag**: Cada campo criptografado tem seu próprio IV e tag de autenticação
5. **Nenhuma Chave Armazenada**: A chave criptográfica nunca é armazenada no backend

### Frontend (React/Next.js)

1. **Senha Mestra em Memória**: A senha mestra é armazenada apenas em memória
2. **Descriptografia Local**: Todos os dados são descriptografados no frontend
3. **Timeout Automático**: Opção de configurar timeout para limpar a senha mestra da memória
4. **Context API**: Gerenciamento centralizado do estado da senha mestra

## Estrutura do Banco de Dados

### Tabela `credentials` atualizada:

```sql
CREATE TABLE "Credential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "loginUsernameEncrypted" TEXT NOT NULL,
  "loginPasswordEncrypted" TEXT NOT NULL,
  "usernameIv" TEXT NOT NULL,
  "usernameAuthTag" TEXT NOT NULL,
  "passwordIv" TEXT NOT NULL,
  "passwordAuthTag" TEXT NOT NULL,
  "salt" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);
```

## Fluxo de Funcionamento

### 1. Login do Usuário
- Usuário faz login com email/senha
- Backend retorna JWT token
- Frontend armazena token no localStorage

### 2. Desbloqueio do Vault
- Usuário clica em "Unlock Vault"
- Modal solicita senha mestra
- Senha mestra é armazenada em memória via Context API
- Frontend busca credenciais criptografadas do backend

### 3. Adição de Credenciais
- Usuário preenche dados da credencial
- Frontend envia dados + senha mestra para o backend
- Backend deriva chave da senha mestra
- Backend criptografa username e password separadamente
- Dados criptografados são salvos no banco

### 4. Visualização de Credenciais
- Frontend recebe dados criptografados do backend
- Frontend deriva chave da senha mestra em memória
- Frontend descriptografa username e password
- Dados são exibidos na interface

## Arquivos Implementados

### Backend
- `src/utils/crypto.js` - Utilitários de criptografia
- `src/middlewares/auth.js` - Middleware de autenticação JWT
- `src/controllers/credentials.controller.js` - Controller atualizado
- `prisma/schema.prisma` - Schema atualizado

### Frontend
- `src/app/utils/crypto.ts` - Utilitários de descriptografia
- `src/app/contexts/MasterPasswordContext.tsx` - Context para senha mestra
- `src/app/components/MasterPasswordModal.tsx` - Modal de senha mestra
- `src/app/components/AddPasswordModal.tsx` - Modal atualizado
- `src/app/components/PasswordSection.tsx` - Componente principal atualizado
- `src/app/layout.tsx` - Layout com Provider
- `next.config.ts` - Configuração de proxy

## Configuração

### Backend
```bash
cd backend
npm install
npm run migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Segurança

### Medidas Implementadas
1. **Criptografia Autenticada**: AES-256-GCM previne tampering
2. **Derivação Segura de Chave**: PBKDF2 com 100.000 iterações
3. **Salt Único**: Cada credencial tem salt diferente
4. **IV Único**: Cada campo tem IV diferente
5. **Nenhum Storage Persistente**: Senha mestra nunca é salva
6. **Timeout Automático**: Opção de limpar senha mestra por inatividade

### Considerações
- A senha mestra deve ser forte (mínimo 8 caracteres)
- O timeout automático pode ser configurado pelo usuário
- Todos os dados sensíveis são criptografados antes de sair do frontend

## Próximos Passos (Opcionais)

1. **Implementar timeout automático** com configuração do usuário
2. **Adicionar validação de força da senha mestra**
3. **Implementar backup/exportação de credenciais**
4. **Adicionar auditoria de acesso**
5. **Implementar criptografia para TOTP secrets** 