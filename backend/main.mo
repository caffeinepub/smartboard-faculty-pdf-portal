import Map "mo:core/Map";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
  type UserProfile = {
    name : Text;
  };

  var currentUserProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  public type Annotation = {
    id : Nat;
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

  public type AnnotationCreateResult = {
    #success;
    #error : Text;
  };

  public type AnnotationUpdateResult = {
    #success;
    #error : Text;
  };

  public type AnnotationDeleteResult = {
    #success;
    #error : Text;
  };

  public type SyncResult = {
    #success : SyncState;
    #error : Text;
  };

  public type SyncState = {
    lastSyncTimestamp : Int;
    unsyncedChanges : Nat;
  };

  public type AnnotationWithSync = {
    annotation : Annotation;
    synced : Bool;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    currentUserProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    currentUserProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    currentUserProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addAnnotation(annotation : Annotation) : async AnnotationCreateResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add annotations");
    };
    let _ = {
      annotation;
      synced = false;
    };
    #success;
  };

  public shared ({ caller }) func updateAnnotation(_annotation : Annotation) : async AnnotationUpdateResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update annotations");
    };
    #success;
  };

  public shared ({ caller }) func deleteAnnotation(_annotationId : Nat) : async AnnotationDeleteResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete annotations");
    };
    #success;
  };

  public shared ({ caller }) func syncAnnotations() : async SyncResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can sync annotations");
    };
    let syncState = {
      lastSyncTimestamp = Time.now();
      unsyncedChanges = 0;
    };
    #success(syncState);
  };
};
