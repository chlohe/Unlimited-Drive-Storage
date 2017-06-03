var udsFolderName = "Unlimited Drive Storage";
var udsDatabaseName = "udsDatabase";

// Create the page
function doGet(e) {
 
  return HtmlService
   .createTemplateFromFile('home')
   .evaluate()
   .setTitle('Unlimited Drive Storage');
  
  
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

function upload(data, file) {
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
    
    var document = DocumentApp.create(file);
    var text = document.getBody().editAsText();
    text.insertText(0, data);
    var documentId = document.getId();
    var documentApp = DriveApp.getFileById(documentId);
    folder.addFile(documentApp);
    DriveApp.removeFile(documentApp);
    
    updateDatabase(file, documentId, contentType);
    
    return "Success";
    
  } catch (f) {
    return f.toString();
  } 
}

// Convert an existing doc
function importFile(fileID) {
 var file = DriveApp.getFileById(fileID);
 var blob = file.getBlob();
 var string = blob.isGoogleType();
  
 
 return string;
}


// Manage Database

function updateDatabase(filename, id, contenttype) {
  
  var file, files = DriveApp.getFilesByName(udsDatabaseName); //Retrieve the ID
  
  //Check if the doc exists. If it doesn't, return nothing
  if (files.hasNext ()){
   file = files.next(); 
  } else {
    return "";
  }
  
  SpreadsheetApp.openById(file.getId()).getActiveSheet().appendRow([filename, id, contenttype]);
}

// Rebuild a file from base64

function reassemble(fileID) {
  
  // Reassemble should work for any time of file stored inside the database.
  
  var file = DocumentApp.openById(fileID);
  var fileText = file.getBody().getText();
    
  return fileText;
}