import Map "mo:core/Map";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

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

  public type PdfMetadata = {
    id : Nat;
    title : Text;
    contentBase64 : Text;
    assignedFaculty : [Text];
    isTaught : Bool;
  };

  var pdfs = Map.empty<Nat, PdfMetadata>();

  public query ({ caller }) func getPdfById(pdfId : Nat) : async ?PdfMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access PDFs");
    };
    pdfs.get(pdfId);
  };

  public shared ({ caller }) func addPdf(pdf : PdfMetadata) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add PDFs");
    };
    pdfs.add(pdf.id, pdf);
  };

  public shared ({ caller }) func markPdfAsTaught(pdfId : Nat) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can mark PDFs as taught");
    };
    switch (pdfs.get(pdfId)) {
      case (?pdf) {
        let updatedPdf = { pdf with isTaught = true };
        pdfs.add(pdfId, updatedPdf);
        true;
      };
      case (null) { false };
    };
  };

  public type BillingCycle = { #monthly; #quarterly; #halfYearly; #yearly };

  public type PlanTier = { #basic; #premium; #diamond };

  public type SubscriptionPlan = {
    tier : PlanTier;
    cycle : BillingCycle;
    maxFaculty : Nat;
    maxPdfLimit : Nat;
    maxLicenses : Nat;
    priceInr : Nat;
  };

  public type PriceList = [
    {
      tier : PlanTier;
      cycle : BillingCycle;
      maxFaculty : Nat;
      maxPdfLimit : Nat;
      maxLicenses : Nat;
      priceInr : Nat;
    }
  ];

  func getAllPlans() : PriceList {
    [
      {
        tier = #basic;
        cycle = #monthly;
        maxFaculty = 30;
        maxPdfLimit = 500;
        maxLicenses = 2;
        priceInr = 8000;
      },
      {
        tier = #basic;
        cycle = #quarterly;
        maxFaculty = 30;
        maxPdfLimit = 500;
        maxLicenses = 2;
        priceInr = 25000;
      },
      {
        tier = #basic;
        cycle = #halfYearly;
        maxFaculty = 30;
        maxPdfLimit = 500;
        maxLicenses = 2;
        priceInr = 50000;
      },
      {
        tier = #basic;
        cycle = #yearly;
        maxFaculty = 30;
        maxPdfLimit = 500;
        maxLicenses = 2;
        priceInr = 100000;
      },
      {
        tier = #premium;
        cycle = #monthly;
        maxFaculty = 100;
        maxPdfLimit = 2000;
        maxLicenses = 4;
        priceInr = 16500;
      },
      {
        tier = #premium;
        cycle = #quarterly;
        maxFaculty = 100;
        maxPdfLimit = 2000;
        maxLicenses = 4;
        priceInr = 50000;
      },
      {
        tier = #premium;
        cycle = #halfYearly;
        maxFaculty = 100;
        maxPdfLimit = 2000;
        maxLicenses = 4;
        priceInr = 100000;
      },
      {
        tier = #premium;
        cycle = #yearly;
        maxFaculty = 100;
        maxPdfLimit = 2000;
        maxLicenses = 4;
        priceInr = 200000;
      },
      {
        tier = #diamond;
        cycle = #monthly;
        maxFaculty = 500;
        maxPdfLimit = 5000;
        maxLicenses = 6;
        priceInr = 33000;
      },
      {
        tier = #diamond;
        cycle = #quarterly;
        maxFaculty = 500;
        maxPdfLimit = 5000;
        maxLicenses = 6;
        priceInr = 100000;
      },
      {
        tier = #diamond;
        cycle = #halfYearly;
        maxFaculty = 500;
        maxPdfLimit = 5000;
        maxLicenses = 6;
        priceInr = 200000;
      },
      {
        tier = #diamond;
        cycle = #yearly;
        maxFaculty = 500;
        maxPdfLimit = 5000;
        maxLicenses = 6;
        priceInr = 400000;
      },
    ];
  };

  var currentPlan : ?SubscriptionPlan = null;

  func getDefaultPlan() : {
    tier : PlanTier;
    cycle : BillingCycle;
    maxFaculty : Nat;
    maxPdfLimit : Nat;
    maxLicenses : Nat;
    priceInr : Nat;
  } {
    {
      tier = #basic;
      cycle = #monthly;
      maxFaculty = 30;
      maxPdfLimit = 500;
      maxLicenses = 2;
      priceInr = 8000;
    };
  };

  public query ({ caller }) func getActiveSubscriptionPlan() : async SubscriptionPlan {
    let plan = switch (currentPlan, caller) {
      case (?activePlan, _) {
        activePlan;
      };
      case (null, _) {
        getDefaultPlan();
      };
    };

    plan;
  };

  public shared ({ caller }) func setSubscriptionPlan(newPlan : SubscriptionPlan) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update plans");
    };
    currentPlan := ?newPlan;
  };

  public query ({ caller }) func getAvailablePriceList() : async PriceList {
    ignore caller;
    getAllPlans();
  };

  public query ({ caller }) func getCurrentSubscriptionLimits() : async { maxFaculty : Nat; maxPdfLimit : Nat; maxLicenses : Nat } {
    let plan = switch (currentPlan, caller) {
      case (?activePlan, _) {
        activePlan;
      };
      case (null, _) {
        getDefaultPlan();
      };
    };

    {
      plan with
      maxFaculty = plan.maxFaculty;
      maxPdfLimit = plan.maxPdfLimit;
      maxLicenses = plan.maxLicenses;
    };
  };
};

