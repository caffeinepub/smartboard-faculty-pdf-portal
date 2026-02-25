import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import Iter "mo:core/Iter";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
  type UserProfile = {
    name : Text;
  };

  type Faculty = {
    id : Nat;
    name : Text;
    active : Bool;
  };

  module Faculty {
    public func compare(f1 : Faculty, f2 : Faculty) : Order.Order {
      if (f1.active and not f2.active) { return #less };
      if (not f1.active and f2.active) { return #greater };
      Nat.compare(f1.id, f2.id);
    };
  };

  type PDF = {
    id : Nat;
    title : Text;
    uploadDate : Int;
    facultyIds : [Nat];
    taught : Bool;
    content : Text;
  };

  module PDF {
    public func compare(p1 : PDF, p2 : PDF) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  type Annotation = {
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

  type FacultyWithPdfCount = {
    faculty : Faculty;
    pdfCount : Nat;
  };

  module Annotation {
    public func compareByTimestamp(a1 : Annotation, a2 : Annotation) : Order.Order {
      Int.compare(a1.timestamp, a2.timestamp);
    };
  };

  type AdminCredentials = {
    username : Text;
    password : Text; // In practice, this should be a hash
  };

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let faculty = Map.empty<Nat, Faculty>();
  let pdfs = Map.empty<Nat, PDF>();
  let annotations = Map.empty<Nat, Annotation>();
  var nextFacultyId = 0;
  var nextPdfId = 0;
  var nextAnnotationId = 0;

  // Default admin credentials
  var adminCredentials : AdminCredentials = {
    username = "admin";
    password = "admin1234";
  };

  public type FacultyCreateResult = {
    #success;
    #limitReached : Nat;
    #error : Text;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getFaculty() : async [Faculty] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get faculty");
    };
    faculty.values().toArray();
  };

  public shared ({ caller }) func createFaculty(name : Text) : async FacultyCreateResult {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #error("createFaculty function is admin-only");
    };

    let currentFacultyCount = faculty.size();
    let facultyLimit = 30; // default limit for #basic #monthly, min 30 for all plans

    if (currentFacultyCount >= facultyLimit) {
      return #limitReached(currentFacultyCount);
    };

    let nameTrimmed = name.trimStart(#char(' ')).trimEnd(#char(' '));
    if (nameTrimmed.isEmpty()) {
      return #error("Faculty name cannot be empty or whitespace");
    };

    let exists = faculty.values().any(func(f) { f.name == nameTrimmed });

    if (exists) {
      return #error("Faculty with the name '" # nameTrimmed # "' already exists");
    };

    let id = nextFacultyId;
    faculty.add(
      id,
      {
        id;
        name = nameTrimmed;
        active = true;
      },
    );
    nextFacultyId += 1;
    #success;
  };

  public query ({ caller }) func getPDFsByFaculty(facultyId : Nat) : async [PDF] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view PDFs");
    };
    pdfs.values().toArray().filter(
      func(pdf : PDF) : Bool {
        pdf.facultyIds.any(func(id : Nat) : Bool { id == facultyId });
      }
    );
  };

  public shared ({ caller }) func markAsTaught(pdfId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark PDFs as taught");
    };
    switch (pdfs.get(pdfId)) {
      case (null) { Runtime.trap("PDF not found") };
      case (?pdf) {
        let updatedPDF = { pdf with taught = true };
        pdfs.add(pdfId, updatedPDF);
      };
    };
  };

  public shared ({ caller }) func saveAnnotation(
    pdfId : Nat,
    pageNumber : Nat,
    annotationType : Text,
    coordinates : Text,
    endX : ?Float,
    endY : ?Float,
    imageData : ?Text,
    shapeType : ?Text,
    fillColor : ?Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save annotations");
    };
    let id = nextAnnotationId;
    annotations.add(
      id,
      {
        pdfId;
        pageNumber;
        annotationType;
        coordinates;
        timestamp = Time.now();
        endX;
        endY;
        imageData;
        shapeType;
        fillColor;
      },
    );
    nextAnnotationId += 1;
    id;
  };

  public query ({ caller }) func getAnnotationsByPDF(pdfId : Nat) : async [Annotation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view annotations");
    };
    annotations.values().toArray().filter(
      func(annotation : Annotation) : Bool {
        annotation.pdfId == pdfId;
      }
    ).sort(Annotation.compareByTimestamp);
  };

  public query ({ caller }) func getAllFacultyWithPdfCount() : async [FacultyWithPdfCount] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all faculty with PDF counts");
    };
    faculty.values().toArray().map(
      func(f : Faculty) : FacultyWithPdfCount {
        let matchingPdfs = pdfs.values().toArray().filter(
          func(pdf : PDF) : Bool {
            pdf.facultyIds.any(
              func(cid : Nat) : Bool {
                cid == f.id;
              }
            );
          }
        );
        {
          faculty = f;
          pdfCount = matchingPdfs.size();
        };
      }
    );
  };

  // Admin credential management functions

  public shared ({ caller }) func setAdminCredentials(username : Text, password : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update credentials");
    };

    let trimmedUsername = username.trimStart(#char(' ')).trimEnd(#char(' '));
    if (trimmedUsername.size() == 0) {
      return false;
    };
    if (password.size() < 6) {
      return false;
    };

    adminCredentials := {
      username = trimmedUsername;
      password;
    };
    true;
  };

  public shared ({ caller }) func verifyAdminCredentials(username : Text, password : Text) : async Bool {
    username == adminCredentials.username and password == adminCredentials.password
  };

  public shared ({ caller }) func resetAdminCredentials() : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reset credentials");
    };
    adminCredentials := {
      username = "admin";
      password = "admin1234";
    };
    true;
  };

};
