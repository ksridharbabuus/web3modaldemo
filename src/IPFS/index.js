


import { useState } from "react";
import { create } from "ipfs-http-client";

const client = create('https://ipfs.infura.io:5001/api/v0');

const IPFSComponent = () => {

    const [file, setFile] = useState(null);
    const [urlArr, setUrlArr] = useState([]);

    const retrieveFile = (e) => {
        const data = e.target.files[0];
        const reader = new window.FileReader();
        reader.readAsArrayBuffer(data);
        reader.onloadend = () => {
          console.log("Buffer data: ", Buffer(reader.result));
          setFile(Buffer(reader.result));
        }
    
        e.preventDefault();  
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const created = await client.add(file);
          const url = `https://ipfs.infura.io/ipfs/${created.path}`;
          setUrlArr(prev => [...prev, url]);      
        } catch (error) {
          console.log(error.message);
        }
      };

    return (
        <>
            <div className="App">
            <form className="form" onSubmit={handleSubmit}>
                <input type="file" name="data" onChange={retrieveFile} />
                <button type="submit" className="btn">Upload file</button>
            </form>
            </div>

            <div className="display">
            {urlArr.length !== 0
            ? urlArr.map((el) => <img src={el} alt="nfts" />)
            : <h3>Upload data</h3>}
            </div>
        </>
        
      )

}



export default IPFSComponent;