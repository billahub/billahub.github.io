
var tbl_apps = document.getElementById("tbl-apps");

var tbl_data = [
    {
        name: "receiveVideo-v1",
        desc: "Able to receive <strong>the video stream</strong> from the client.",
        link: "/webrtc/receiveVideo.html"
    },
    {
        name: "sendVideo-v1",
        desc: "Able to send <strong>the video stream</strong> to the client.",
        link: "/webrtc/sendVideo.html"
    },
    {
        name: "receiveData-v1",
        desc: "Able to receive <strong>the data</strong> from the client.",
        link: "/webrtc/receiveData.html"
    },
    {
        name: "sendData-v1",
        desc: "Able to send <strong>the data</strong> to the client.",
        link: "/webrtc/sendData.html"
    },
    {
        name: "receiveVideoData-v1",
        desc: "Able to receive <strong>video and data</strong> from the client.",
        link: "/webrtc/receiveVideoData.html"
    },
    {
        name: "sendVideoData-v1",
        desc: "Able to send <strong>video and data</strong> to the client.",
        link: "/webrtc/sendVideoData.html"
    }
];

function fillRows(){
    tbl_data.forEach(rowData => {
        var row = document.createElement("tr");
        var data1 = document.createElement("td");
        data1.innerHTML = rowData.name;
        var data2 = document.createElement("td");
        data2.innerHTML = rowData.desc;
        var link = document.createElement("a");
        link.href = rowData.link;
        link.innerHTML = "click here";
        var data3 = document.createElement("td");
        data3.appendChild(link);
        row.appendChild(data1);
        row.appendChild(data2);
        row.appendChild(data3);
        tbl_apps.childNodes[1].appendChild(row);
    });
}

fillRows();