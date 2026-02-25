import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Text "mo:core/Text";

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

  type OldAdminCredentials = {
    username : Text;
    password : Text;
  };

  type OldUserProfile = {
    name : Text;
  };

  type OldActor = {
    var userProfiles : Map.Map<Principal, OldUserProfile>;
    var faculty : Map.Map<Nat, OldFaculty>;
    var pdfs : Map.Map<Nat, OldPDF>;
    var annotations : Map.Map<Nat, OldAnnotation>;
    var nextFacultyId : Nat;
    var nextPdfId : Nat;
    var nextAnnotationId : Nat;
    var adminCredentials : OldAdminCredentials;
  };

  type NewUserProfile = {
    name : Text;
  };

  type NewActor = {
    var currentUserProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(_old : OldActor) : NewActor {
    {
      var currentUserProfiles = Map.empty<Principal, NewUserProfile>();
    };
  };
};
