
var tbl_apps = document.getElementById("tbl-apps");

var tbl_data = [{
    name: "remoteVideo-v1",
    desc: "Able to get <strong>the video stream</strong> from the client.",
    link: "/remoteVideo.html"
}];

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