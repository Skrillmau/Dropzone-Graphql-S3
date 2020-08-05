import React, { useState } from "react";
import axios from "axios";
import moment from "moment";
import Dropzone from "react-dropzone";
import { gql, graphql, useMutation } from "@apollo/client";
import { EditorState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import draftToMarkdown from "draftjs-to-markdown";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import Markdown from "markdown-to-jsx";
import "./index.css";
function App(props) {
  const [title, setTitle] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [file, setFile] = useState(undefined);
  const [editorState, setEditorStateChange] = useState(undefined);
  const [url,setUrl] = useState("");

  const s3SignMutation = gql`
    mutation signS3($input: S3Signinput) {
      signS3(input: $input) {
        signedRequest
        url
      }
    }
  `;
  const nuevaEntradaMutation = gql`
    mutation nuevaEntrada($input: EntradaInput) {
      nuevaEntrada(input: $input) {
        id
        titulo
        imagen
        cuerpo
        categoria
      }
    }
  `;
  const [signS3] = useMutation(s3SignMutation);
  const [nuevaEntrada] = useMutation(nuevaEntradaMutation);
  async function onDrop(files) {
    setFile(files[0]);
  }

  function onChange(e) {
    console.log(e.target.name);
    if (e.target.name === "title") {
      setTitle(e.target.value);
    } else if (e.target.name === "cuerpo") {
      setCuerpo(e.target.value);
    } else {
      setCategoria(e.target.value);
    }
  }
  async function uploadToS3(file, signedRequest) {
    const options = {
      headers: {
        "Content-Type": file.type,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
        "X-Requested-With": "XMLHttpRequest",
        "Access-Control-Allow-Credentials": true,
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
    try {
      const response = await signS3({
        variables: {
          input: {
            key: "Empleados/",
            filename: formatFilename(file.name),
            filetype: file.type,
          },
        },
      });

      const { signedRequest, url } = response.data.signS3;
      console.log(url);
      await uploadToS3(file, signedRequest);

      const response2 = await nuevaEntrada({
        variables: {
          input: {
            titulo: title,
            cuerpo: draftToMarkdown(
              convertToRaw(editorState.getCurrentContent())
            ),
            imagen: url,
            categoria: categoria,
          },
        },
      });
      console.log(response2.data.nuevaEntrada);
      setCuerpo(response2.data.nuevaEntrada.cuerpo);
      setUrl(url);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div>
      <input name="title" type="text" onChange={onChange} value={title} />
      <input
        name="categoria"
        type="text"
        onChange={onChange}
        value={categoria}
      />
      <Editor
        editorState={editorState}
        toolbarClassName="toolbarClassName"
        wrapperClassName="wrapperClassName"
        editorClassName="editorClassName"
        onEditorStateChange={setEditorStateChange}
        toolbar={{
          options: ["inline","blockType", "list", "link","colorPicker", "history"],
          colorPicker:{
            colors: ['#2e2e2e','#142882','#e60000'],
          }
        }}
      />
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
      <Markdown className="chokolochupa">{cuerpo}</Markdown>
      <img src={url}></img>
    </div>
  );
}

export default App;
