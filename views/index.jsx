const React = require('react');
const { Button } = require('antd');

function Index(props) {
  return (
    <html>
      <head>
        <title>{props.title}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/4.16.13/antd.min.css" />
      </head>
      <body>
        <h1>{props.title}</h1>
        <p>Welcome to your Express app with React views!</p>
        <Button type="primary">Ant Design Button</Button>
      </body>
    </html>
  );
}

module.exports = Index;