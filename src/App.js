import React, { useState } from "react";
import axios from "axios";
import moment from "moment";
import Dropzone from "react-dropzone";
import { gql, graphql, useMutation } from "@apollo/client";
function App(props) {
  const [name, setName] = useState(undefined);
  const [file, setFile] = useState(undefined);

  const s3SignMutation = gql`
    mutation signS3($input: S3Signinput) {
      signS3(input: $input) {
        signedRequest
        url
      }
    }
  `;
  const [signS3] = useMutation(s3SignMutation);
  async function onDrop(files) {
    setFile(files[0]);
  }

  function onChange(e) {
    setName(e.target.value);
  }
  async function uploadToS3(file, signedRequest) {
    const options = {
      headers: {
        "Content-Type": file.type,
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
        'X-Requested-With': 'XMLHttpRequest',
        "Access-Control-Allow-Credentials": true
      },
    };
      await axios.put(signedRequest, file, options);
    
    
  }
  function formatFilename(filename) {
    const date = moment().format("YYYYMMDD");
    const randomString = Math.random().toString(36).substring(2, 7);
    const cleanFileName = filename.toLowerCase().replace(/[^a-z0-9.]/g, "-");
    const newFilename = `images/${date}-${randomString}-${cleanFileName}`;
    return newFilename.substring(0, 1024);
  }
  async function submit() {
    console.log(formatFilename(file.name));
    try {
      const response = await signS3({
        variables: {
          input: {
            key: "Empleados/",
            filename: formatFilename(file.name),
            filetype: file.type
          },
        },
      });

      const { signedRequest, url } = response.data.signS3;
      console.log(url)
      await uploadToS3(file, signedRequest);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div>
      <input name="name" onChange={onChange} value={name} />
      <Dropzone onDrop={onDrop}>
        {({ getRootProps, getInputProps }) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
          </section>
        )}
      </Dropzone>
      <button onClick={submit}>Submit</button>
    </div>
  );
}

export default App;
