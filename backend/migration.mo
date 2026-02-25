import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

module {
  type OldFaculty = {
    id : Nat;
    name : Text;
    active : Bool;
  };

  type OldPDF = {
    id : Nat;
    title : Text;
    uploadDate : Int;
    facultyIds : [Nat];
    taught : Bool;
    content : Text;
  };

  type OldAnnotation = {
    pdfId : Nat;
    pageNumber : Nat;
    annotationType : Text;
    coordinates : Text;
    timestamp : Int;
    endX : ?Float;
    endY : ?Float;
    imageData : ?Text;
    shapeType : ?Text;
    fillColor : ?Text;
  };

  type OldActor = {
    faculty : Map.Map<Nat, OldFaculty>;
    pdfs : Map.Map<Nat, OldPDF>;
    annotations : Map.Map<Nat, OldAnnotation>;
    nextFacultyId : Nat;
    nextPdfId : Nat;
    nextAnnotationId : Nat;
  };

  type AdminCredentials = {
    username : Text;
    password : Text;
  };

  type NewActor = {
    faculty : Map.Map<Nat, OldFaculty>;
    pdfs : Map.Map<Nat, OldPDF>;
    annotations : Map.Map<Nat, OldAnnotation>;
    nextFacultyId : Nat;
    nextPdfId : Nat;
    nextAnnotationId : Nat;
    adminCredentials : AdminCredentials;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      adminCredentials = {
        username = "admin";
        password = "admin1234";
      };
    };
  };
};
