const fs = require('fs');
const path = require('path');

const componentName = process.argv[2];

if (!componentName) {
  console.error('❌ Debes especificar un nombre. Ejemplo: npm run crear:componente-crud Usuarios');
  process.exit(1);
}

const folderName = componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

const basePath = path.join(__dirname, '..', 'src', 'pages', folderName);

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
  console.log(`📁 Carpeta creada: ${basePath}`);
}

const files = [
  {
    name: `${componentName}Page.tsx`,
    content: `import { Container } from '@/components';
import { ${componentName}Content } from './${componentName}Content';

const ${componentName}Page = () => {
  return (
    <Container>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Gestión de ${componentName}</h3>
        </div>
        <div className="card-body">
          <${componentName}Content />
        </div>
      </div>
    </Container>
  );
};

export { ${componentName}Page };`
  },
  {
    name: `Modal${componentName}.tsx`,
    content: `const Modal${componentName} = () => {
  return (
    <div>Modal${componentName}</div>
  );
};

export { Modal${componentName} };`
  },
  {
    name: `${componentName}Content.tsx`,
    content: `const ${componentName}Content = () => {
  return (
    <div>${componentName}Content</div>
  );
};

export { ${componentName}Content };`
  },
  {
    name: `index.ts`,
    content: `export * from './${componentName}Page';
export * from './Modal${componentName}';
export * from './${componentName}Content';`
  }
];

files.forEach((file) => {
  const filePath = path.join(basePath, file.name);
  fs.writeFileSync(filePath, file.content);
  console.log(`✅ Archivo creado: ${file.name}`);
});

console.log('🎉 CRUD base generado con éxito.');
