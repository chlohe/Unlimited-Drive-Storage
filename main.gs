var udsFolderName = "Unlimited Drive Storage";
var udsDatabaseName = "udsDatabase";

// Create the page
function doGet(e) {
  
      
  var firstTime = checkIfFirstTime(); //Run the setup (checks if the directories / db exists). If true, its the user's first time and we should probs show a welcome message.
  
  //Return the html service
  return HtmlService
   .createTemplateFromFile((firstTime ? 'welcome' : 'home'))
   //.createTemplateFromFile("welcome")
   .evaluate()
   .setTitle('Unlimited Drive Storage')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);;
  
}

function checkIfFirstTime() {
  var firstTime = false; //Is it their first time?
  
  //The storage folder
  var folder, folders = DriveApp.getFoldersByName(udsFolderName);
  if (!folders.hasNext()){
    firstTime = true;
  }
  else
  {
   folder = folders.next(); //This is required in case the folder exists but the db doesn't
  }
  
  var sheet, file, files = DriveApp.getFilesByName(udsDatabaseName); //Retrieve the database iD
  if (!files.hasNext()){
    firstTime = true;
  }
  
  return firstTime;
}

function setup(){
 
  //Check if the required directories/files exist. If not, make them!
  
  var firstTime = false; //Is it their first time?
  
  //The storage folder
  var folder, folders = DriveApp.getFoldersByName(udsFolderName);
  if (!folders.hasNext()){
    firstTime = true;
    folder = DriveApp.createFolder(udsFolderName); 
  }
  else
  {
   folder = folders.next(); //This is required in case the folder exists but the db doesn't
  }
  
  //The database
  var sheet, file, files = DriveApp.getFilesByName(udsDatabaseName); //Retrieve the database iD
  if (!files.hasNext()){
    firstTime = true;
    sheet = SpreadsheetApp.create(udsDatabaseName);
    sheet.appendRow(["Name","Id","Type","Number of Docs", "Size"]);
    file = DriveApp.getFileById(sheet.getId());
    folder.addFile(file);
    DriveApp.removeFile(file);
  }
   
  return "Success";
  
}

// Allow include of html files in other html files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

function initialSetup(folderName) {
  
  PropertiesService.getScriptProperties().setProperty('FOLDER_NAME', folderName);
  
  /*var folder, folders = DriveApp.getFoldersByName(udsFolder);
 
  if (folders.hasNext()) { // Checking to see if dropbox exists already.
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(dropbox);
  }*/
  
  var folderName2 = PropertiesService.getScriptProperties().getProperty('FOLDER_NAME');
  
  return folderName2;
  
}

function getDatabase() {
  var file, files = DriveApp.getFilesByName(udsDatabaseName); //Retrieve the ID
  
  //Check if the doc exists. If it doesn't, return nothing
  if (files.hasNext ()){
   file = files.next(); 
  } else {
    return "";
  }
  
  var udsDatabase = SpreadsheetApp.openById(file.getId()).getActiveSheet().getDataRange().getValues();
  return udsDatabase;
}

function upload(data, file, fsize) {
  try {
    
    var dropbox = udsFolderName;
    var folder, folders = DriveApp.getFoldersByName(dropbox);
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(dropbox);
    }
        
    var contentType = data.substring(5,data.indexOf(';'));
        /*bytes = Utilities.base64Decode(data.substr(data.indexOf('base64,')+7)),
        blob = Utilities.newBlob(bytes, contentType, file),
        file = folder.createFile(blob);*/
    
    var subFolder = folder.createFolder(file);
    var subfolderID = subFolder.getId();
    
    var maxCharacters = 1000000;
    var numberOfDocs = Math.ceil(data.length / maxCharacters);
    
    var dataArray = new Array();
    for (var i = 0; i < numberOfDocs; i ++) {
      dataArray.push(data.substring(i * maxCharacters, (i + 1) * maxCharacters));
    }
    
    //DocumentApp.create("log").getBody().editAsText().insertText(0, dataArray[0]);
    for (i = 0; i < numberOfDocs; i++) { 
      var document = DocumentApp.create(i);
      var text = document.getBody().editAsText();
      text.insertText(0, dataArray[i]);
      var documentId = document.getId();
      var documentApp = DriveApp.getFileById(documentId);
      subFolder.addFile(documentApp);
      DriveApp.removeFile(documentApp);
    }
    
    updateDatabase(file, subfolderID, contentType, numberOfDocs, fsize);
    
    return "Success";
    
  } catch (f) {
    return f.toString();
  } 
}

// Convert an existing doc
function importFile(fileID) {
 var file = DriveApp.getFileById(fileID);
 var fsize = file.getSize();
 var blob = file.getBlob();
 var bytes = blob.getBytes();
 var base64string = Utilities.base64Encode(blob.getBytes());
 var contentType = blob.getContentType();
 var fileName = file.getName();
  
  var dropbox = udsFolderName;
    var folder, folders = DriveApp.getFoldersByName(dropbox);
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(dropbox);
    }
    var data = "data:" + contentType + ';base64,' + base64string;
    
    var subFolder = folder.createFolder(file);
    var subfolderID = subFolder.getId();
    
    var maxCharacters = 1000000;
    var numberOfDocs = Math.ceil(data.length / maxCharacters);
    
    var dataArray = new Array();
    for (var i = 0; i < numberOfDocs; i ++) {
      dataArray.push(data.substring(i * maxCharacters, (i + 1) * maxCharacters));
    }
    
    //DocumentApp.create("log").getBody().editAsText().insertText(0, dataArray[0]);
    for (i = 0; i < numberOfDocs; i++) { 
      var document = DocumentApp.create(i);
      var text = document.getBody().editAsText();
      text.insertText(0, dataArray[i]);
      var documentId = document.getId();
      var documentApp = DriveApp.getFileById(documentId);
      subFolder.addFile(documentApp);
      DriveApp.removeFile(documentApp);
    }
    
    updateDatabase(file, subfolderID, contentType, numberOfDocs, fsize);
  
    DriveApp.getFileById(fileID).setTrashed(true);
 
 return fileName;
}


// Manage Database

function updateDatabase(filename, id, contenttype, numberofdocs, fsize) {
  
  var hsize = bytesToSize(fsize);
  
  var file, files = DriveApp.getFilesByName(udsDatabaseName); //Retrieve the ID
  
  //Check if the doc exists. If it doesn't, return nothing
  if (files.hasNext ()){
   file = files.next(); 
  } else {
    return "";
  }
  
  SpreadsheetApp.openById(file.getId()).getActiveSheet().appendRow([filename, id, contenttype, numberofdocs, hsize]);
}

// Rebuild a file from base64

function reassemble(subfolderID, numberOfDocs) {
  
  // Reassemble should work for any time of file stored inside the database.
  var folder = DriveApp.getFolderById(subfolderID);
  var fileText = "";
  
  //Stitch all the parts back together
  for (var i = 0; i < numberOfDocs; i++){
    var partId = folder.getFilesByName(i).next().getId();
    fileText += DocumentApp.openById(partId).getBody().getText();
  }
  
  return fileText;
}